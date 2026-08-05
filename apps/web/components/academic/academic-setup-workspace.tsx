"use client";

import type { AcademicOverviewResponse } from "@school-platform/contracts";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

type Props = {
  branchId: string | null;
  overview: AcademicOverviewResponse;
};

type Resource =
  | "years"
  | "periods"
  | "grades"
  | "classes"
  | "sections"
  | "subjects"
  | "subject-offerings"
  | "teaching-assignments";

type Feedback = {
  kind: "success" | "error";
  message: string;
} | null;

function requiredString(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function optionalString(form: FormData, key: string) {
  const value = requiredString(form, key);
  return value.length > 0 ? value : null;
}

function numberValue(form: FormData, key: string) {
  return Number(requiredString(form, key));
}

export function AcademicSetupWorkspace({ branchId, overview }: Props) {
  const router = useRouter();
  const [pendingResource, setPendingResource] = useState<Resource | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function submit(
    event: FormEvent<HTMLFormElement>,
    resource: Resource,
    payload: (form: FormData) => Record<string, unknown>,
  ) {
    event.preventDefault();
    setPendingResource(resource);
    setFeedback(null);

    const formElement = event.currentTarget;
    const response = await fetch(`/api/academic/${resource}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload(new FormData(formElement))),
    });

    const body = (await response.json().catch(() => null)) as { title?: string } | null;

    if (!response.ok) {
      setFeedback({
        kind: "error",
        message: body?.title ?? "The academic record could not be saved.",
      });
      setPendingResource(null);
      return;
    }

    formElement.reset();
    setFeedback({
      kind: "success",
      message: "Academic setup record created successfully.",
    });
    setPendingResource(null);
    router.refresh();
  }

  const effectiveBranchId =
    branchId ??
    overview.branches[0]?.id ??
    overview.classOfferings[0]?.branchId ??
    overview.subjectOfferings[0]?.branchId;

  return (
    <div className="academic-workspace">
      {feedback ? (
        <p
          className={`form-message ${
            feedback.kind === "error" ? "form-message--error" : "form-message--success"
          }`}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      ) : null}

      <section className="academic-summary" aria-label="Academic setup summary">
        <article>
          <strong>{overview.academicYears.length}</strong>
          <span>Academic years</span>
        </article>
        <article>
          <strong>{overview.classOfferings.length}</strong>
          <span>Class offerings</span>
        </article>
        <article>
          <strong>{overview.sectionOfferings.length}</strong>
          <span>Sections</span>
        </article>
        <article>
          <strong>{overview.subjectOfferings.length}</strong>
          <span>Subject offerings</span>
        </article>
      </section>

      <section className="academic-section">
        <header>
          <div>
            <p className="eyebrow">01 · CALENDAR</p>
            <h2>Academic year and periods</h2>
          </div>
          <p>Create the date boundaries used by enrollment, exams, and reporting.</p>
        </header>

        <div className="academic-form-grid">
          <form
            className="setup-form"
            onSubmit={(event) =>
              submit(event, "years", (form) => ({
                code: requiredString(form, "code").toUpperCase(),
                name: requiredString(form, "name"),
                startDate: requiredString(form, "startDate"),
                endDate: requiredString(form, "endDate"),
                status: requiredString(form, "status"),
              }))
            }
          >
            <h3>Add academic year</h3>
            <label className="field">
              <span>Code</span>
              <input name="code" placeholder="AY-2026" required />
            </label>
            <label className="field">
              <span>Name</span>
              <input name="name" placeholder="Academic Year 2026" required />
            </label>
            <div className="form-grid">
              <label className="field">
                <span>Start date</span>
                <input name="startDate" type="date" required />
              </label>
              <label className="field">
                <span>End date</span>
                <input name="endDate" type="date" required />
              </label>
            </div>
            <label className="field">
              <span>Status</span>
              <select name="status" defaultValue="DRAFT">
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
              </select>
            </label>
            <button
              className="button button--primary"
              disabled={pendingResource === "years"}
              type="submit"
            >
              {pendingResource === "years" ? "Saving…" : "Add academic year"}
            </button>
          </form>

          <form
            className="setup-form"
            onSubmit={(event) =>
              submit(event, "periods", (form) => ({
                academicYearId: requiredString(form, "academicYearId"),
                code: requiredString(form, "code").toUpperCase(),
                name: requiredString(form, "name"),
                periodType: requiredString(form, "periodType"),
                sequenceNumber: numberValue(form, "sequenceNumber"),
                startDate: requiredString(form, "startDate"),
                endDate: requiredString(form, "endDate"),
                status: "ACTIVE",
              }))
            }
          >
            <h3>Add term or semester</h3>
            <label className="field">
              <span>Academic year</span>
              <select name="academicYearId" required defaultValue="">
                <option disabled value="">
                  Select year
                </option>
                {overview.academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid">
              <label className="field">
                <span>Code</span>
                <input name="code" placeholder="TERM-1" required />
              </label>
              <label className="field">
                <span>Sequence</span>
                <input name="sequenceNumber" type="number" min="1" defaultValue="1" required />
              </label>
            </div>
            <label className="field">
              <span>Name</span>
              <input name="name" placeholder="First Term" required />
            </label>
            <label className="field">
              <span>Period type</span>
              <select name="periodType" defaultValue="TERM">
                <option value="TERM">Term</option>
                <option value="SEMESTER">Semester</option>
                <option value="QUARTER">Quarter</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </label>
            <div className="form-grid">
              <label className="field">
                <span>Start date</span>
                <input name="startDate" type="date" required />
              </label>
              <label className="field">
                <span>End date</span>
                <input name="endDate" type="date" required />
              </label>
            </div>
            <button
              className="button button--primary"
              disabled={pendingResource === "periods" || overview.academicYears.length === 0}
              type="submit"
            >
              {pendingResource === "periods" ? "Saving…" : "Add period"}
            </button>
          </form>
        </div>

        <div className="record-list">
          {overview.academicYears.length === 0 ? (
            <p className="empty-state">No academic year has been created yet.</p>
          ) : (
            overview.academicYears.map((year) => (
              <article key={year.id}>
                <div>
                  <strong>{year.name}</strong>
                  <span>
                    {year.startDate} → {year.endDate}
                  </span>
                </div>
                <span className="status-pill">{year.status}</span>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="academic-section">
        <header>
          <div>
            <p className="eyebrow">02 · STRUCTURE</p>
            <h2>Grade, class, and section</h2>
          </div>
          <p>Define reusable grades and their branch-specific yearly offerings.</p>
        </header>

        <div className="academic-form-grid academic-form-grid--three">
          <form
            className="setup-form"
            onSubmit={(event) =>
              submit(event, "grades", (form) => ({
                code: requiredString(form, "code").toUpperCase(),
                name: requiredString(form, "name"),
                sequenceNumber: numberValue(form, "sequenceNumber"),
                status: "ACTIVE",
              }))
            }
          >
            <h3>Add grade level</h3>
            <label className="field">
              <span>Code</span>
              <input name="code" placeholder="GRADE-6" required />
            </label>
            <label className="field">
              <span>Name</span>
              <input name="name" placeholder="Grade 6" required />
            </label>
            <label className="field">
              <span>Sequence</span>
              <input name="sequenceNumber" type="number" min="1" required />
            </label>
            <button
              className="button button--primary"
              disabled={pendingResource === "grades"}
              type="submit"
            >
              Add grade
            </button>
          </form>

          <form
            className="setup-form"
            onSubmit={(event) =>
              submit(event, "classes", (form) => ({
                branchId: branchId ?? requiredString(form, "branchId"),
                academicYearId: requiredString(form, "academicYearId"),
                gradeLevelId: requiredString(form, "gradeLevelId"),
                code: requiredString(form, "code").toUpperCase(),
                name: requiredString(form, "name"),
                capacity: numberValue(form, "capacity"),
                status: "DRAFT",
              }))
            }
          >
            <h3>Add class offering</h3>
            {!branchId ? (
              <label className="field">
                <span>Branch</span>
                <select name="branchId" required defaultValue="">
                  <option disabled value="">
                    Select branch
                  </option>
                  {overview.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="field">
              <span>Academic year</span>
              <select name="academicYearId" required defaultValue="">
                <option disabled value="">
                  Select year
                </option>
                {overview.academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Grade</span>
              <select name="gradeLevelId" required defaultValue="">
                <option disabled value="">
                  Select grade
                </option>
                {overview.gradeLevels.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid">
              <label className="field">
                <span>Code</span>
                <input name="code" placeholder="G6-2026" required />
              </label>
              <label className="field">
                <span>Capacity</span>
                <input name="capacity" type="number" min="1" defaultValue="40" required />
              </label>
            </div>
            <label className="field">
              <span>Name</span>
              <input name="name" placeholder="Grade 6" required />
            </label>
            <button
              className="button button--primary"
              disabled={
                pendingResource === "classes" ||
                overview.academicYears.length === 0 ||
                overview.gradeLevels.length === 0
              }
              type="submit"
            >
              Add class
            </button>
          </form>

          <form
            className="setup-form"
            onSubmit={(event) =>
              submit(event, "sections", (form) => ({
                classOfferingId: requiredString(form, "classOfferingId"),
                code: requiredString(form, "code").toUpperCase(),
                name: requiredString(form, "name"),
                capacity: numberValue(form, "capacity"),
                status: "DRAFT",
              }))
            }
          >
            <h3>Add section</h3>
            <label className="field">
              <span>Class offering</span>
              <select name="classOfferingId" required defaultValue="">
                <option disabled value="">
                  Select class
                </option>
                {overview.classOfferings.map((classOffering) => (
                  <option key={classOffering.id} value={classOffering.id}>
                    {classOffering.name} · {classOffering.academicYearName}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid">
              <label className="field">
                <span>Code</span>
                <input name="code" placeholder="A" required />
              </label>
              <label className="field">
                <span>Capacity</span>
                <input name="capacity" type="number" min="1" defaultValue="40" required />
              </label>
            </div>
            <label className="field">
              <span>Name</span>
              <input name="name" placeholder="Section A" required />
            </label>
            <button
              className="button button--primary"
              disabled={pendingResource === "sections" || overview.classOfferings.length === 0}
              type="submit"
            >
              Add section
            </button>
          </form>
        </div>

        <section className="record-table" aria-label="Class offerings">
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Academic year</th>
                <th>Grade</th>
                <th>Capacity</th>
                <th>Sections</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {overview.classOfferings.map((classOffering) => (
                <tr key={classOffering.id}>
                  <td>{classOffering.name}</td>
                  <td>{classOffering.academicYearName}</td>
                  <td>{classOffering.gradeLevelName}</td>
                  <td>{classOffering.capacity}</td>
                  <td>{classOffering.sectionCount}</td>
                  <td>{classOffering.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {overview.classOfferings.length === 0 ? (
            <p className="empty-state">No class offering has been created yet.</p>
          ) : null}
        </section>
      </section>

      <section className="academic-section">
        <header>
          <div>
            <p className="eyebrow">03 · SUBJECTS</p>
            <h2>Subjects and teaching assignments</h2>
          </div>
          <p>Publish subjects into a class and assign an eligible teacher by section.</p>
        </header>

        <div className="academic-form-grid academic-form-grid--three">
          <form
            className="setup-form"
            onSubmit={(event) =>
              submit(event, "subjects", (form) => ({
                code: requiredString(form, "code").toUpperCase(),
                name: requiredString(form, "name"),
                shortName: requiredString(form, "shortName"),
                status: "ACTIVE",
              }))
            }
          >
            <h3>Add subject</h3>
            <label className="field">
              <span>Code</span>
              <input name="code" placeholder="MAT" required />
            </label>
            <label className="field">
              <span>Name</span>
              <input name="name" placeholder="Mathematics" required />
            </label>
            <label className="field">
              <span>Short name</span>
              <input name="shortName" placeholder="Math" required />
            </label>
            <button
              className="button button--primary"
              disabled={pendingResource === "subjects"}
              type="submit"
            >
              Add subject
            </button>
          </form>

          <form
            className="setup-form"
            onSubmit={(event) =>
              submit(event, "subject-offerings", (form) => {
                const classOfferingId = requiredString(form, "classOfferingId");
                const classOffering = overview.classOfferings.find(
                  (item) => item.id === classOfferingId,
                );

                return {
                  branchId: branchId ?? classOffering?.branchId ?? effectiveBranchId ?? "",
                  academicYearId: classOffering?.academicYearId ?? "",
                  classOfferingId,
                  subjectMasterId: requiredString(form, "subjectMasterId"),
                  compulsory: requiredString(form, "compulsory") === "true",
                  weeklyPeriods: numberValue(form, "weeklyPeriods"),
                  status: "DRAFT",
                };
              })
            }
          >
            <h3>Add subject offering</h3>
            <label className="field">
              <span>Class</span>
              <select name="classOfferingId" required defaultValue="">
                <option disabled value="">
                  Select class
                </option>
                {overview.classOfferings.map((classOffering) => (
                  <option key={classOffering.id} value={classOffering.id}>
                    {classOffering.name} · {classOffering.academicYearName}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Subject</span>
              <select name="subjectMasterId" required defaultValue="">
                <option disabled value="">
                  Select subject
                </option>
                {overview.subjectMasters.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid">
              <label className="field">
                <span>Weekly periods</span>
                <input name="weeklyPeriods" type="number" min="1" max="30" defaultValue="5" />
              </label>
              <label className="field">
                <span>Requirement</span>
                <select name="compulsory" defaultValue="true">
                  <option value="true">Compulsory</option>
                  <option value="false">Elective</option>
                </select>
              </label>
            </div>
            <button
              className="button button--primary"
              disabled={
                pendingResource === "subject-offerings" ||
                overview.classOfferings.length === 0 ||
                overview.subjectMasters.length === 0
              }
              type="submit"
            >
              Add offering
            </button>
          </form>

          <form
            className="setup-form"
            onSubmit={(event) =>
              submit(event, "teaching-assignments", (form) => {
                const subjectOfferingId = requiredString(form, "subjectOfferingId");
                const offering = overview.subjectOfferings.find(
                  (item) => item.id === subjectOfferingId,
                );

                return {
                  branchId: branchId ?? offering?.branchId ?? effectiveBranchId ?? "",
                  subjectOfferingId,
                  sectionOfferingId: requiredString(form, "sectionOfferingId"),
                  teacherMembershipId: requiredString(form, "teacherMembershipId"),
                  role: requiredString(form, "role"),
                  effectiveFrom: requiredString(form, "effectiveFrom"),
                  effectiveTo: optionalString(form, "effectiveTo"),
                  status: "ACTIVE",
                };
              })
            }
          >
            <h3>Assign teacher</h3>
            <label className="field">
              <span>Subject offering</span>
              <select name="subjectOfferingId" required defaultValue="">
                <option disabled value="">
                  Select subject
                </option>
                {overview.subjectOfferings.map((offering) => (
                  <option key={offering.id} value={offering.id}>
                    {offering.classOfferingName} · {offering.subjectName}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Section</span>
              <select name="sectionOfferingId" required defaultValue="">
                <option disabled value="">
                  Select section
                </option>
                {overview.sectionOfferings.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.classOfferingName} · {section.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Teacher</span>
              <select name="teacherMembershipId" required defaultValue="">
                <option disabled value="">
                  Select teacher
                </option>
                {overview.eligibleTeachers.map((teacher) => (
                  <option key={teacher.membershipId} value={teacher.membershipId}>
                    {teacher.displayName}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid">
              <label className="field">
                <span>Role</span>
                <select name="role" defaultValue="LEAD">
                  <option value="LEAD">Lead</option>
                  <option value="ASSISTANT">Assistant</option>
                </select>
              </label>
              <label className="field">
                <span>Effective from</span>
                <input name="effectiveFrom" type="date" required />
              </label>
            </div>
            <label className="field">
              <span>Effective to (optional)</span>
              <input name="effectiveTo" type="date" />
            </label>
            {overview.eligibleTeachers.length === 0 ? (
              <p className="form-message">
                Add a teacher or employee membership in People &amp; Access before assigning.
              </p>
            ) : null}
            <button
              className="button button--primary"
              disabled={
                pendingResource === "teaching-assignments" ||
                overview.subjectOfferings.length === 0 ||
                overview.sectionOfferings.length === 0 ||
                overview.eligibleTeachers.length === 0
              }
              type="submit"
            >
              Assign teacher
            </button>
          </form>
        </div>

        <section className="record-table" aria-label="Subject offerings">
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Subject</th>
                <th>Weekly periods</th>
                <th>Requirement</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {overview.subjectOfferings.map((offering) => (
                <tr key={offering.id}>
                  <td>{offering.classOfferingName}</td>
                  <td>{offering.subjectName}</td>
                  <td>{offering.weeklyPeriods}</td>
                  <td>{offering.compulsory ? "Compulsory" : "Elective"}</td>
                  <td>{offering.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {overview.subjectOfferings.length === 0 ? (
            <p className="empty-state">No subject offering has been created yet.</p>
          ) : null}
        </section>
      </section>
    </div>
  );
}
