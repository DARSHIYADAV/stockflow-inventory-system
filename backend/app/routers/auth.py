from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_current_user_optional
from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import PasswordChange, Token, UserOut, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserRegister,
    db: AsyncSession = Depends(get_db),
    actor: User | None = Depends(get_current_user_optional),
):
    result = await db.execute(select(func.count()).select_from(User))
    user_count = result.scalar_one()

    if user_count == 0:
        # Bootstrap case: no users exist yet, so the first registration is
        # open and always becomes an admin regardless of the requested role.
        role = UserRole.admin
    else:
        # Every subsequent registration requires an authenticated admin.
        if actor is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if actor.role != UserRole.admin:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
        role = payload.role

    existing = await db.scalar(select(User).where(User.email == payload.email))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def _authenticate(
    form_data: OAuth2PasswordRequestForm, db: AsyncSession, expected_role: UserRole | None
) -> Token:
    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
    )

    user = await db.scalar(select(User).where(User.email == form_data.username))
    if user is None or not verify_password(form_data.password, user.password_hash):
        raise invalid_credentials

    # A wrong-role attempt gets the exact same error as a wrong password —
    # never a distinct message — so probing a role-specific login endpoint
    # can't be used to learn whether an email exists or what role it has.
    if expected_role is not None and user.role != expected_role:
        raise invalid_credentials

    access_token = create_access_token(user_id=user.id, role=user.role.value)
    return Token(access_token=access_token)


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    return await _authenticate(form_data, db, expected_role=None)


@router.post("/login/admin", response_model=Token)
async def login_admin(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    return await _authenticate(form_data, db, expected_role=UserRole.admin)


@router.post("/login/manager", response_model=Token)
async def login_manager(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    return await _authenticate(form_data, db, expected_role=UserRole.manager)


@router.post("/login/employee", response_model=Token)
async def login_employee(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    return await _authenticate(form_data, db, expected_role=UserRole.employee)


@router.get("/me", response_model=UserOut)
async def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/change-password", response_model=UserOut)
async def change_password(
    payload: PasswordChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    current_user.password_hash = hash_password(payload.new_password)
    await db.commit()
    await db.refresh(current_user)
    return current_user
