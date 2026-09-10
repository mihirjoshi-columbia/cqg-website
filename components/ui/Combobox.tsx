"use client";

import { useEffect, useRef, useState } from "react";

// A plain text input that also works as a name: typing filters `options`
// down to matches, clicking one fills the box. Whatever's in the box at
// submit time is the value — so a school missing from the list can still be
// typed in and submitted freely, rather than blocking the applicant.
export default function Combobox({
    id,
    name,
    options,
    placeholder,
    defaultValue = "",
    required = false,
}: {
    id?: string;
    name: string;
    options: string[];
    placeholder?: string;
    defaultValue?: string;
    required?: boolean;
}) {
    const [value, setValue] = useState(defaultValue);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const query = value.trim().toLowerCase();
    const filtered = query.length === 0 ? [] : options.filter((o) => o.toLowerCase().includes(query)).slice(0, 50);

    return (
        <div className="combobox" ref={containerRef}>
            <input
                id={id}
                name={name}
                type="text"
                autoComplete="off"
                className="field-input"
                placeholder={placeholder}
                required={required}
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
            />
            {open && filtered.length > 0 && (
                <ul className="combobox-list">
                    {filtered.map((opt) => (
                        <li key={opt}>
                            <button
                                type="button"
                                className="combobox-option"
                                onClick={() => {
                                    setValue(opt);
                                    setOpen(false);
                                }}
                            >
                                {opt}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
