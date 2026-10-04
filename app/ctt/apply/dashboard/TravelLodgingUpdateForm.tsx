"use client";

import { useFormStatus } from "react-dom";
import TravelLodgingFields from "@/components/ctt/TravelLodgingFields";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn-cqg btn-pink btn-sm w-fit" disabled={pending}>
            {pending ? "Saving…" : "Save answers"}
        </button>
    );
}

export default function TravelLodgingUpdateForm({ action }: { action: (formData: FormData) => void | Promise<void> }) {
    return (
        <form action={action} className="flex flex-col gap-4 border-t border-line pt-4 mt-1">
            <p className="text-ink-soft text-sm">
                We split our travel &amp; housing question into two. Please answer both — the rest of your
                application stays as it is.
            </p>
            <TravelLodgingFields />
            <SubmitButton />
        </form>
    );
}
