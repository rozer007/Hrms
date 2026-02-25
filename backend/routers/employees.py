from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from services import employee_services
from database import get_db
from schemas import EmployeeCreate, EmployeeResponse, EmployeeListResponse, DashboardStats

router = APIRouter()


@router.post("/create_employee", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(payload: EmployeeCreate, db: AsyncSession = Depends(get_db)):
    response = await employee_services.create_employee(payload,db)
    return response


@router.get("/list_employees", response_model=EmployeeListResponse)
async def list_employees(db: AsyncSession = Depends(get_db)):
    response = await employee_services.list_employees(db)
    return response
    

@router.get("/get_employee/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: str, db: AsyncSession = Depends(get_db)):
    response = await employee_services.get_employee(employee_id,db)
    return response


@router.delete("/delete_employee/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(employee_id: str, db: AsyncSession = Depends(get_db)):
    response = await employee_services.delete_employee(employee_id,db)
    return response

@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(db: AsyncSession = Depends(get_db)):
    response = await employee_services.dashboard(db)
    return response