from asyncio.log import logger
from datetime import date
import uuid
from fastapi import HTTPException, Query
from models import Attendance, AttendanceStatus, Employee
from schemas import AttendanceCreate, AttendanceListResponse, AttendanceResponse, DashboardStats, EmployeeCreate, EmployeeListResponse, EmployeeResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

async def mark_attendance(payload: AttendanceCreate, db: AsyncSession):
    try:
        emp = await db.scalar(select(Employee).where(Employee.id == payload.employee_id))
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")

        # Check duplicate entry for same employee + date
        existing = await db.scalar(
            select(Attendance).where(
                and_(Attendance.employee_id == payload.employee_id, Attendance.date == payload.date)
            )
        )
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Attendance already marked for this employee on {payload.date}"
            )

        record = Attendance(
            id=str(uuid.uuid4()),
            employee_id=payload.employee_id,
            date=payload.date,
            status=payload.status,
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)
        result = AttendanceResponse.model_validate(record)
        result.employee_name=str(emp.full_name)
        return result
    except HTTPException:
        await db.rollback()
        raise
    except:
        await db.rollback()
        logger.exception("Unexpected error while marking attendance")

        raise HTTPException(
            status_code=500,
            detail="Unexpected error while marking attendance"
        )

async def list_attendance(
    db: AsyncSession,
    employee_id: str | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None)
):
    try:
        query = select(Attendance).order_by(Attendance.date.desc())
        filters = []

        if employee_id:
            filters.append(Attendance.employee_id == employee_id)
        if date_from:
            filters.append(Attendance.date >= date_from)
        if date_to:
            filters.append(Attendance.date <= date_to)

        if filters:
            query = query.where(and_(*filters))

        result = await db.execute(query)
        records = result.scalars().all()

        # Enrich with employee names
        response_list = []
        emp_cache = {}
        for rec in records:
            emp_id=str(rec.employee_id)
            if emp_id not in emp_cache:
                emp = await db.scalar(select(Employee).where(Employee.id == emp_id))
                emp_cache[emp_id] = emp.full_name if emp else "Unknown"
            r = AttendanceResponse.model_validate(rec)
            r.employee_name = emp_cache[emp_id]
            response_list.append(r)

        total_present = sum(1 for r in response_list if r.status == AttendanceStatus.present)

        return AttendanceListResponse(
            records=response_list,
            total=len(response_list),
            total_present=total_present,
        )
    except:
        await db.rollback()
        logger.exception("Unexpected error while listing attendance")

        raise HTTPException(
            status_code=500,
            detail="Unexpected error while listing attendance"
        )

async def delete_attendance(attendance_id: str, db: AsyncSession):
    try:
        rec = await db.scalar(select(Attendance).where(Attendance.id == attendance_id))
        if not rec:
            raise HTTPException(status_code=404, detail="Attendance record not found")
        await db.delete(rec)
        await db.commit()
    except HTTPException:
        await db.rollback()
        raise
    except:
        await db.rollback()
        logger.exception("Unexpected error while deleting attendance")

        raise HTTPException(
            status_code=500,
            detail="Unexpected error while deleting attendance"
        )
