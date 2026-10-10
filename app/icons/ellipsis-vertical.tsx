export const EllipsisVerticalIcon = (props: React.SVGProps<SVGSVGElement>) => {
    return (
        // <svg
        //     xmlns="http://www.w3.org/2000/svg"
        //     viewBox="0 0 24 24"
        //     fill="none"
        //     stroke="currentColor"
        //     strokeWidth={1.7}
        //     strokeLinecap="round"
        //     strokeLinejoin="round"
        //     {...props}
        // >
        //     <path d="M12 6h.01M12 12h.01M12 18h.01" />
        // </svg>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-5">
            <circle cx="12" cy="5" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="12" cy="19" r="1.8" />
        </svg>
    );
};