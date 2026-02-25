from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import date as date_d, datetime
from typing import Optional
from models import AttendanceStatus


# Employee schemas
class EmployeeCreate(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    department: str

    @field_validator("id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Employee ID cannot be empty")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Full name cannot be empty")
        return v

    @field_validator("department")
    @classmethod
    def validate_department(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Department cannot be empty")
        return v


class EmployeeResponse(BaseModel):
    id: str
    full_name: str
    email: str
    department: str
    created_at: datetime
    total_present: Optional[int] = 0

    model_config = {"from_attributes": True}


class EmployeeListResponse(BaseModel):
    employees: list[EmployeeResponse]
    total: int


# Attendance schemas
class AttendanceCreate(BaseModel):
    employee_id: str
    date: date_d = Field(default_factory=date_d.today)
    status: AttendanceStatus


class AttendanceResponse(BaseModel):
    id: str
    employee_id: str
    date: date_d
    status: AttendanceStatus
    created_at: datetime
    employee_name: Optional[str]=None
    
    model_config = {"from_attributes": True}


class AttendanceListResponse(BaseModel):
    records: list[AttendanceResponse]
    total: int
    total_present: Optional[int] = None


# Dashboard schema
class DashboardStats(BaseModel):
    total_employees: int
    total_departments: int
    present_today: int
    absent_today: int
