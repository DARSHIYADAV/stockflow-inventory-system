from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_admin, require_admin_or_manager
from app.core.security import hash_password
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import ManagedUserCreate, PasswordReset, UserOut, UserRoleUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_managed_user(
    payload: ManagedUserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Admin creates a manager or employee account with a password the
    admin sets directly. Admin accounts can only ever come from the
    bootstrap-first-admin flow in POST /auth/register, never here.
    """
    existing = await db.scalar(select(User).where(User.email == payload.email))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole(payload.role),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    result = await db.execute(select(User).order_by(User.created_at))
    return result.scalars().all()


@router.get("/assignable", response_model=list[UserOut])
async def list_assignable_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    """
    A narrower view than GET /users (which is admin-only, per the Roles
    table): just enough user info for admin/manager to pick who an asset
    gets assigned to, without exposing full user management.
    """
    result = await db.execute(select(User).order_by(User.name))
    return result.scalars().all()


@router.put("/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: UUID,
    payload: UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.role == UserRole.admin:
        # payload.role can only be "manager" or "employee" (never "admin"),
        # so reaching here always means demoting this admin away.
        admin_count = await db.scalar(
            select(func.count()).select_from(User).where(User.role == UserRole.admin)
        )
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot change role: this is the last remaining admin",
            )

    user.role = UserRole(payload.role)
    await db.commit()
    await db.refresh(user)
    return user


@router.put("/{user_id}/reset-password", response_model=UserOut)
async def reset_password(
    user_id: UUID,
    payload: PasswordReset,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    target_user = await db.get(User, user_id)
    if target_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    target_user.password_hash = hash_password(payload.new_password)
    await db.commit()
    await db.refresh(target_user)
    return target_user
