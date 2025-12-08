import React from 'react';

interface DynamicColorCircleProps {
    color: string;
}

export function DynamicColorCircle({ color }: DynamicColorCircleProps) {
    const divRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (divRef.current) {
            divRef.current.style.setProperty('--dynamic-color', color);
        }
    }, [color]);

    return (
        <div
            ref={divRef}
            className="w-5 h-5 rounded-full dynamic-bg"
        />
    );
}
