import { useEffect, useLayoutEffect, useState } from "react";

export default function Spotlight({
    targetRef,
    title,
    description,
    step,
    totalSteps,
    primaryLabel = "Next",
    secondaryLabel = "Skip",
    onPrimary,
    onSecondary,
    allowTargetInteraction = false,
    hideActions = false,
}) {
    const [targetRect, setTargetRect] = useState(null);
    const [viewport, setViewport] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useLayoutEffect(() => {
        function updatePosition() {
            if (!targetRef?.current) return;

            const rect = targetRef.current.getBoundingClientRect();

            setTargetRect({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                right: rect.right,
                bottom: rect.bottom,
            });

            setViewport({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }

        updatePosition();

        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);

        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [targetRef]);

    if (!targetRect) return null;

    const spotlightPadding = 8;
    const spotlightRadius = 18;

    const spotlightTop = targetRect.top - spotlightPadding;
    const spotlightLeft = targetRect.left - spotlightPadding;
    const spotlightWidth = targetRect.width + spotlightPadding * 2;
    const spotlightHeight = targetRect.height + spotlightPadding * 2;

    const tooltipWidth = Math.min(320, viewport.width - 32);

    const tooltipLeft = Math.min(
        Math.max(
            16,
            targetRect.left + targetRect.width / 2 - tooltipWidth / 2
        ),
        viewport.width - tooltipWidth - 16
    );

    let tooltipTop = targetRect.bottom + 44;

    const estimatedTooltipHeight = 190;
    if (tooltipTop + estimatedTooltipHeight > viewport.height - 16) {
        tooltipTop = Math.max(16, targetRect.top - estimatedTooltipHeight - 24);
    }

    return (
        <div className="pointer-events-none fixed inset-0 z-[200]">
            <svg
                className="pointer-events-none absolute inset-0 z-[202]"
                width={viewport.width}
                height={viewport.height}
                viewBox={`0 0 ${viewport.width} ${viewport.height}`}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <mask id="spotlight-mask">
                        <rect
                            x="0"
                            y="0"
                            width={viewport.width}
                            height={viewport.height}
                            fill="white"
                        />
                        <rect
                            x={spotlightLeft}
                            y={spotlightTop}
                            width={spotlightWidth}
                            height={spotlightHeight}
                            rx={spotlightRadius}
                            ry={spotlightRadius}
                            fill="black"
                        />
                    </mask>
                </defs>

                <rect
                    x="0"
                    y="0"
                    width={viewport.width}
                    height={viewport.height}
                    fill="rgba(0,0,0,0.45)"
                    mask="url(#spotlight-mask)"
                />
            </svg>

            <div
                className="pointer-events-none absolute z-[203] rounded-[18px] border-2 border-[rgb(203,84,51)]"
                style={{
                    top: `${spotlightTop}px`,
                    left: `${spotlightLeft}px`,
                    width: `${spotlightWidth}px`,
                    height: `${spotlightHeight}px`,
                }}
            />

            <div
                className="pointer-events-auto absolute z-[204] rounded-xl bg-white p-4 shadow-xl"
                style={{
                    top: `${tooltipTop}px`,
                    left: `${tooltipLeft}px`,
                    width: `${tooltipWidth}px`,
                }}
            >
                <div className="flex flex-col gap-2">
                    <p className="text-xs text-[rgb(137,122,114)]">
                        Step {step} of {totalSteps}
                    </p>

                    <p className="text-sm font-medium text-stone-800">{title}</p>
                    <p className="text-sm text-[rgb(137,122,114)]">{description}</p>

                    {!hideActions && (
                        <div className="flex items-center gap-2 pt-2">
                            <button
                                type="button"
                                onClick={onPrimary}
                                className="rounded-lg bg-[rgb(203,84,51)] px-4 py-2 text-sm text-white hover:cursor-pointer"
                            >
                                {primaryLabel}
                            </button>

                            <button
                                type="button"
                                onClick={onSecondary}
                                className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-700 hover:cursor-pointer"
                            >
                                {secondaryLabel}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}