import { useState } from "react";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";

export default function RatingSelector({ value, onChange }) {
    const [hoverValue, setHoverValue] = useState(null);

    function renderStar(starNumber) {
        const activeValue = hoverValue ?? value ?? 0;

        if (activeValue >= starNumber) {
            return <FaStar className="text-[rgb(203,84,51)]" />;
        }

        if (activeValue >= starNumber - 0.5) {
            return <FaStarHalfAlt className="text-[rgb(203,84,51)]" />;
        }

        return <FaRegStar className="text-stone-300" />;
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="relative">
                        <button
                            type="button"
                            className="absolute left-0 top-0 h-full w-1/2"
                            onMouseEnter={() => setHoverValue(star - 0.5)}
                            onMouseLeave={() => setHoverValue(null)}
                            onClick={() => onChange(star - 0.5)}
                            aria-label={`${star - 0.5} stars`}
                        />
                        <button
                            type="button"
                            className="absolute right-0 top-0 h-full w-1/2"
                            onMouseEnter={() => setHoverValue(star)}
                            onMouseLeave={() => setHoverValue(null)}
                            onClick={() => onChange(star)}
                            aria-label={`${star} stars`}
                        />
                        <div className="pointer-events-none text-2xl">{renderStar(star)}</div>
                    </div>
                ))}

                {value ? (
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        className="ml-2 text-sm text-stone-500 underline"
                    >
                        Clear
                    </button>
                ) : null}
            </div>
        </div>
    );
}