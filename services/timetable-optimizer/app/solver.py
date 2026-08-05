from ortools.sat.python import cp_model

from .models import SolveRequest, SolveResponse


def solve_timetable(request: SolveRequest) -> SolveResponse:
    model = cp_model.CpModel()
    variables: dict[tuple[str, str], cp_model.IntVar] = {}

    for occurrence in request.occurrences:
        for slot in request.slots:
            variables[(occurrence, slot)] = model.new_bool_var(
                f"assign_{occurrence}_{slot}"
            )

    for occurrence in request.occurrences:
        model.add_exactly_one(
            variables[(occurrence, slot)] for slot in request.slots
        )

    for slot in request.slots:
        model.add_at_most_one(
            variables[(occurrence, slot)] for occurrence in request.occurrences
        )

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5
    status = solver.solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return SolveResponse(status="INFEASIBLE", assignments={})

    assignments: dict[str, str] = {}
    for occurrence in request.occurrences:
        for slot in request.slots:
            if solver.value(variables[(occurrence, slot)]):
                assignments[occurrence] = slot
                break

    return SolveResponse(
        status="OPTIMAL" if status == cp_model.OPTIMAL else "FEASIBLE",
        assignments=assignments,
    )
