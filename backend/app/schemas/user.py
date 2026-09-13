from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.user import UserRole


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.employee


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: EmailStr
    role: UserRole
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRoleUpdate(BaseModel):
    """
    Changes an existing user's role — restricted to manager/employee.
    Promoting someone to admin is never allowed here; admin accounts
    only ever come from the bootstrap-first-admin flow in POST /auth/register.
    Demoting an existing admin down to manager/employee is still allowed
    (guarded separately by the last-admin check in the route).
    """

    role: Literal["manager", "employee"]


class ManagedUserCreate(BaseModel):
    """Admin-created user via POST /users — role restricted to non-admin."""

    name: str
    email: EmailStr
    password: str
    role: Literal["manager", "employee"]


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class PasswordReset(BaseModel):
    new_password: str
