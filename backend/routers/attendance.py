from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import date
import uuid
from services import attendance_services
from database import get_db
from models import Employee, Attendance, AttendanceStatus
from schemas import AttendanceCreate, AttendanceResponse, AttendanceListResponse

router = APIRouter()


@router.post("/mark_attendance", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
async def mark_attendance(payload: AttendanceCreate, db: AsyncSession = Depends(get_db)):
    response = await attendance_services.mark_attendance(payload,db)
    return response

@router.get("/list_attendance", response_model=AttendanceListResponse)
async def list_attendance(
    employee_id: str | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    response = await attendance_services.list_attendance(db,employee_id,date_from,date_to)
    return response

@router.delete("/delete_attendance/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attendance(attendance_id: str, db: AsyncSession = Depends(get_db)):
    response = await attendance_services.delete_attendance(attendance_id,db)
    return response
