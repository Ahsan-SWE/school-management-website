from fastapi import FastAPI

from .models import SolveRequest, SolveResponse
from .solver import solve_timetable

app = FastAPI(title="School Platform Timetable Optimizer", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "timetable-optimizer", "status": "ok"}


@app.post("/solve", response_model=SolveResponse)
def solve(request: SolveRequest) -> SolveResponse:
    return solve_timetable(request)
