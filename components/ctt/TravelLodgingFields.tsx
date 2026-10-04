function YesNo({ name, label, hint }: { name: string; label: string; hint?: string }) {
    return (
        <div className="field">
            <span className="field-label">{label}</span>
            <div className="field-radio-group">
                <div className="field-radio-option">
                    <input type="radio" id={`${name}_yes`} name={name} value="yes" required />
                    <label htmlFor={`${name}_yes`}>Yes</label>
                </div>
                <div className="field-radio-option">
                    <input type="radio" id={`${name}_no`} name={name} value="no" required />
                    <label htmlFor={`${name}_no`}>No</label>
                </div>
            </div>
            {hint && <span className="field-hint">{hint}</span>}
        </div>
    );
}

// Asked of non-Columbia/Barnard applicants only; local students aren't asked.
export default function TravelLodgingFields() {
    return (
        <>
            <YesNo name="travel_needed" label="Will you need travel accommodations?" />
            <YesNo
                name="lodging_needed"
                label="Will you need lodging accommodations?"
                hint="We set travel and lodging stipends based on where you're traveling from — you should expect them to be fully covered."
            />
        </>
    );
}
