from asyncio.log import logger
from datetime import date
from fastapi import HTTPException
from models import Attendance, AttendanceStatus, Employee
from schemas import DashboardStats, EmployeeCreate, EmployeeListResponse, EmployeeResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

async def create_employee(payload:EmployeeCreate,db:AsyncSession):
    try:
         # Check duplicate ID
        existing_id = await db.scalar(select(Employee).where(Employee.id == payload.id))
        if existing_id:
            raise HTTPException(status_code=409, detail=f"Employee ID '{payload.id}' already exists")

        # Check duplicate email
        existing_email = await db.scalar(select(Employee).where(Employee.email == payload.email))
        if existing_email:
            raise HTTPException(status_code=409, detail=f"Email '{payload.email}' already registered")

        employee = Employee(
            id=payload.id,
            full_name=payload.full_name,
            email=payload.email,
            department=payload.department,
        )
        db.add(employee)
        await db.commit()
        await db.refresh(employee)

        result = EmployeeResponse.model_validate(employee)
        return result
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error while creating employee")

        raise HTTPException(
            status_code=500,
            detail="Unexpected error while creating employee"
        )

async def list_employees(db:AsyncSession):
    try:
        result = await db.execute(select(Employee).order_by(Employee.created_at.desc()))
        employees = result.scalars().all()

        response_list = []
        for emp in employees:
            count = await db.scalar(
                select(func.count()).where(
                    and_(Attendance.employee_id == emp.id, Attendance.status == AttendanceStatus.present)
                )
            )
            emp_response = EmployeeResponse.model_validate(emp)
            emp_response.total_present = count or 0
            response_list.append(emp_response)

        return EmployeeListResponse(employees=response_list, total=len(response_list))
    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error while listing employee")

        raise HTTPException(
            status_code=500,
            detail="Unexpected error while listing employee"
        )

async def get_employee(employee_id: str, db: AsyncSession):
    try:
        emp = await db.scalar(select(Employee).where(Employee.id == employee_id))
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")
        count = await db.scalar(
            select(func.count()).where(
                and_(Attendance.employee_id == emp.id, Attendance.status == AttendanceStatus.present)
            )
        )
        result = EmployeeResponse.model_validate(emp)
        result.total_present = count or 0
        return result
    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error while fetching employee")

        raise HTTPException(
            status_code=500,
            detail="Unexpected error while fetching employee"
        )

async def delete_employee(employee_id: str, db: AsyncSession):
    try:
        emp = await db.scalar(select(Employee).where(Employee.id == employee_id))
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")
        await db.delete(emp)
        await db.commit()
    except HTTPException:
        await db.rollback()
        raise
    except:
        await db.rollback()
        logger.exception("Unexpected error while deleting employee")

        raise HTTPException(
            status_code=500,
            detail="Unexpected error while deleting employee"
        )

async def dashboard(db: AsyncSession):
    try:
        total_employees = await db.scalar(select(func.count()).select_from(Employee))
        total_departments = await db.scalar(select(func.count(Employee.department.distinct())).select_from(Employee))
        today = date.today()
        present_today = await db.scalar(
            select(func.count()).where(
                and_(Attendance.date == today, Attendance.status == AttendanceStatus.present)
            )
        )
        absent_today = await db.scalar(
            select(func.count()).where(
                and_(Attendance.date == today, Attendance.status == AttendanceStatus.absent)
            )
        )
        return DashboardStats(
            total_employees=total_employees or 0,
            total_departments=total_departments or 0,
            present_today=present_today or 0,
            absent_today=absent_today or 0,
        )
    except:
        await db.rollback()
        logger.exception("Unexpected error while displaying dashboard")

        raise HTTPException(
            status_code=500,
            detail="Unexpected error while deleting employee"
        )
