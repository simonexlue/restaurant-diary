import placeholder from "../../assets/auth-hero.jpg"
import { MdPeopleOutline } from "react-icons/md";
import { FaStar, FaRegStar, FaStarHalfAlt, FaRegHeart, FaRegComment } from "react-icons/fa";
import TagPill from "../ui/TagPill";
import { useState } from "react";
import { LuChevronUp, LuChevronDown } from "react-icons/lu";
import { HiOutlinePencil } from "react-icons/hi2";
import { GoTrash } from "react-icons/go";
import CommentCard from "./CommentCard";
import useUserProfile from "../../hooks/useUserProfile";
import { getProfilePhotoUrl } from "../../services/profile";
import { useEffect } from "react";

export default function DishCard({
    dishName,
    itemRating,
    price,
    dateTried,
    review,
    tags = [],
    photoUrl,
    isOpen,
    onToggle,
    onEdit,
    onDelete,
    isDeleting = false,
    likeCount = 0,
    likedByCurrentUser = false,
    onLikeToggle,
    commentCount = 0,
    comments = [],
    currentUserId,
    onAddComment,
    onDeleteComment,
}) {
    const { profile } = useUserProfile();
    const [currentUserAvatar, setCurrentUserAvatar] = useState(null);
    const [comment, setComment] = useState("")
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    useEffect(() => {
        async function loadAvatar() {
            if (!profile?.avatar_url) {
                setCurrentUserAvatar(null);
                return;
            }

            const signedUrl = await getProfilePhotoUrl(profile.avatar_url);
            setCurrentUserAvatar(signedUrl);
        }

        loadAvatar();
    }, [profile?.avatar_url]);

    function renderStars(rating) {
        const numericRating = Number(rating || 0);
        const stars = [];

        for (let i = 1; i <= 5; i++) {
            if (numericRating >= i) {
                stars.push(<FaStar key={i} />)
            } else if (numericRating >= i - 0.5) {
                stars.push(<FaStarHalfAlt key={i} />)
            } else {
                stars.push(<FaRegStar key={i} />)
            }
        }
        return stars
    }

    async function handleSubmitComment() {
        const trimmedComment = comment.trim();

        if (!trimmedComment || !onAddComment) return;

        try {
            setIsSubmittingComment(true);
            await onAddComment(trimmedComment);
            setComment("");
        } finally {
            setIsSubmittingComment(false);
        }
    }

    return (
        <div className="border border-stone-300 bg-white rounded-lg overflow-hidden shadow-sm">
            {/* Top section */}
            <div className="grid grid-cols-1 md:grid-cols-[18rem_minmax(0,1fr)] md:gap-3">
                <div className="relative h-50 md:h-40 min-h-40 overflow-hidden">
                    <img
                        src={photoUrl || placeholder}
                        alt={dishName || "Dish photo"}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                </div>

                <div className="bg-white px-4 py-4 w-full flex flex-col md:py-6">
                    <div className="flex flex-col">
                        <div className="flex flex-row justify-between items-start">
                            <p className="text-stone-800 md:text-xl">{dishName}</p>
                            <div className="flex items-center gap-1 mr-3">
                                {onEdit && (
                                    <button
                                        type="button"
                                        className="text-md px-2 py-1 text-green-700 hover:cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit();
                                        }}
                                    >
                                        <HiOutlinePencil />
                                    </button>
                                )}

                                {onDelete && (
                                    <button
                                        type="button"
                                        className="text-md px-2 py-1 text-red-400 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete();
                                        }}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? "..." : <GoTrash />}
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className="text-lg hover:cursor-pointer text-stone-800"
                                    onClick={onToggle}
                                >
                                    {isOpen ? <LuChevronUp /> : <LuChevronDown />}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-row gap-3 text-sm text-[rgb(137,122,114)] items-center mt-2 md:text-md md:mt-2">
                            <div className="flex flex-row text-[rgb(203,84,51)] text-lg">
                                {renderStars(itemRating)}
                            </div>

                            <p>{price ? `$${price}` : "No price"}</p>
                            <p>{dateTried}</p>
                        </div>
                    </div>

                    <div className="mt-3 flex flex-row justify-between">
                        {Array.isArray(tags) && tags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <TagPill key={tag} label={tag} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-stone-400">No tags</p>
                        )}
                        <div className="flex flex-row text-xs items-center gap-2 text-[rgb(137,122,114)]">
                            <button
                                type="button"
                                onClick={onLikeToggle}
                                className="flex flex-row gap-1 items-center hover:cursor-pointer "
                            >
                                <FaRegHeart className={likedByCurrentUser ? "text-[rgb(203,84,51)]" : "hover:text-[rgb(203,84,51)]"} />
                                <p>{likeCount}</p>
                            </button>
                            <div className="flex flex-row gap-1 items-center">
                                <FaRegComment />
                                <p>{commentCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom expanded section */}
            {isOpen && (
                <div className="border-t border-stone-200 px-4 py-4 md:px-5 text-sm text-stone-800">
                    <p className="px-1 py-2">{review || "No notes added."}</p>

                    <button
                        type="button"
                        onClick={onLikeToggle}
                        className={`flex flex-row items-center gap-1 px-4 py-1 rounded-lg mt-2 hover:cursor-pointer transition ${likedByCurrentUser
                            ? "bg-[rgb(203,84,51)] text-white"
                            : "bg-[rgb(248,245,242)] hover:bg-[rgb(203,84,51)] hover:text-white"
                            }`}
                    >
                        <FaRegHeart />
                        {likedByCurrentUser ? "Liked" : "Like"}
                    </button>

                    <div className="flex flex-row items-center gap-1 mt-3 text-stone-800 text-md">
                        <FaRegComment className="text-[rgb(203,84,51)]" />
                        <p>Comments ({commentCount})</p>
                    </div>

                    <div className="mt-3 flex flex-row gap-2 items-center">
                        <div className="h-8 w-8 overflow-hidden rounded-full bg-stone-100 shrink-0">
                            {currentUserAvatar ? (
                                <img
                                    src={currentUserAvatar}
                                    alt="avatar"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <MdPeopleOutline />
                                </div>
                            )}
                        </div>

                        <input
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSubmitComment();
                                }
                            }}
                            placeholder="Add a comment..."
                            className="border border-stone-200 rounded-lg px-3 py-1 flex-1 bg-[rgb(248,245,242)]"
                        />

                        <button
                            type="button"
                            onClick={handleSubmitComment}
                            disabled={!comment.trim() || isSubmittingComment}
                            className="px-3 py-1 rounded-lg bg-[rgb(203,84,51)] text-white text-sm disabled:opacity-50 hover:cursor-pointer"
                        >
                            Post
                        </button>
                    </div>

                    <div className="flex flex-col gap-4 mt-4">
                        {comments.length === 0 ? (
                            <p className="text-sm text-stone-400">No comments yet.</p>
                        ) : (
                            comments.map((commentItem) => (
                                <CommentCard
                                    key={commentItem.id}
                                    commentId={commentItem.id}
                                    userId={commentItem.user_id}
                                    currentUserId={currentUserId}
                                    displayName={
                                        commentItem.profile?.display_name ||
                                        commentItem.profile?.username ||
                                        "User"
                                    }
                                    avatarUrl={commentItem.profile?.avatar_url || null}
                                    createdAt={commentItem.created_at}
                                    comment={commentItem.comment}
                                    onDelete={
                                        onDeleteComment && commentItem.user_id === currentUserId
                                            ? () => onDeleteComment(commentItem.id)
                                            : undefined
                                    }
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}