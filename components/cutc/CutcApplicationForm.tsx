"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Combobox from "@/components/ui/Combobox";
import { US_COLLEGES } from "@/lib/data/us-colleges";
import { MAJORS } from "@/lib/data/majors";

const GRAD_YEARS = ["2026", "2027", "2028", "2029", "2030", "2031"];
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn-cqg btn-pink btn-sm w-fit" disabled={pending}>
            {pending ? "Submitting…" : "Submit application"}
        </button>
    );
}

export default function CutcApplicationForm({
    action,
    lockedCollege,
    lockedGender,
    cycleLabel,
}: {
    action: (formData: FormData) => void | Promise<void>;
    lockedCollege?: string;
    lockedGender?: string;
    cycleLabel: string;
}) {
    const [major, setMajor] = useState("");

    return (
        <div className="event-card" style={{ maxWidth: 560 }}>
            <div className="event-card-body">
                <span className="tag tag-pink w-fit">Applications open</span>
                <p className="text-ink-soft text-sm">{cycleLabel} is open now. Fill out the application below.</p>

                <form action={action} className="flex flex-col gap-4">
                    <div className="field">
                        <label className="field-label" htmlFor="college">College / University</label>
                        {lockedCollege ? (
                            <>
                                <input className="field-input" type="text" value={lockedCollege} disabled readOnly />
                                <input type="hidden" name="college" value={lockedCollege} />
                            </>
                        ) : (
                            <Combobox
                                id="college"
                                name="college"
                                options={US_COLLEGES}
                                placeholder="Start typing your school…"
                                required
                            />
                        )}
                    </div>

                    <div className="field">
                        <label className="field-label" htmlFor="major">Major</label>
                        <select
                            className="field-select"
                            id="major"
                            name={major === "Other" ? undefined : "major"}
                            required
                            value={major}
                            onChange={(e) => setMajor(e.target.value)}
                        >
                            <option value="" disabled>Select your major</option>
                            {MAJORS.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                        {major === "Other" && (
                            <input
                                className="field-input mt-2"
                                type="text"
                                name="major"
                                placeholder="Tell us your major"
                                required
                            />
                        )}
                    </div>

                    <div className="field">
                        <label className="field-label" htmlFor="grad_year">Expected graduation year</label>
                        <select className="field-select" id="grad_year" name="grad_year" defaultValue="" required>
                            <option value="" disabled>Select a year</option>
                            {GRAD_YEARS.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div className="field">
                        <label className="field-label" htmlFor="country">Country</label>
                        <select className="field-select" id="country" name="country" defaultValue="United States">
                            <option value="United States">United States</option>
                        </select>
                    </div>

                    <div className="field">
                        <label className="field-label" htmlFor="gender">Gender</label>
                        {lockedGender ? (
                            <>
                                <input className="field-input" type="text" value={lockedGender} disabled readOnly />
                                <input type="hidden" name="gender" value={lockedGender} />
                            </>
                        ) : (
                            <select className="field-select" id="gender" name="gender" defaultValue="" required>
                                <option value="" disabled>Select an option</option>
                                {GENDERS.map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="field">
                        <span className="field-label">Have you done a previous trading internship?</span>
                        <div className="field-radio-group">
                            <div className="field-radio-option">
                                <input type="radio" id="prior_internship_yes" name="prior_internship" value="yes" required />
                                <label htmlFor="prior_internship_yes">Yes</label>
                            </div>
                            <div className="field-radio-option">
                                <input type="radio" id="prior_internship_no" name="prior_internship" value="no" required />
                                <label htmlFor="prior_internship_no">No</label>
                            </div>
                        </div>
                    </div>

                    <div className="field">
                        <span className="field-label">
                            Do you have a trading internship/job lined up for Summer 2027?
                        </span>
                        <div className="field-radio-group">
                            <div className="field-radio-option">
                                <input type="radio" id="internship_lined_up_yes" name="internship_lined_up" value="yes" required />
                                <label htmlFor="internship_lined_up_yes">Yes</label>
                            </div>
                            <div className="field-radio-option">
                                <input type="radio" id="internship_lined_up_no" name="internship_lined_up" value="no" required />
                                <label htmlFor="internship_lined_up_no">No</label>
                            </div>
                        </div>
                    </div>

                    <SubmitButton />
                </form>
            </div>
        </div>
    );
}
