from pydantic import BaseModel, Field


class SolveRequest(BaseModel):
    occurrences: list[str] = Field(min_length=1, max_length=500)
    slots: list[str] = Field(min_length=1, max_length=500)


class SolveResponse(BaseModel):
    status: str
    assignments: dict[str, str]
