import { Link } from "react-router-dom"
import FriendsCard from "../components/friends/FriendsCard";
import { MdPeopleOutline } from "react-icons/md";
import FriendsReviewCard from "../components/friends/FriendsReviewCard";
import SentRequestCard from "../components/friends/SentRequestCard";
import { useState } from "react";
export default function Friends() {
    const [activeTab, setActiveTab] = useState("friends");

    return (
        <div className="flex flex-col gap-5 max-w-6xl mx-auto">

            {/*Header */}
            <div className="flex flex-col gap-4 md:flex-row justify-between items-start ">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl text-stone-700">Friends </h1>
                    <p className="text-[rgb(137,122,114)] text-sm">
                        6 friends | 2 pending requests
                    </p>
                </div>

                {/* Link is temporary to /diary/new until page is created */}
                <Link
                    to="/diary/new"
                    className="px-4 py-2 text-sm text-white border rounded-lg bg-[rgb(203,84,51)]"
                >
                    Add Friend
                </Link>
            </div>

            {/* Friend Requests */}
            <div className="flex flex-col gap-3 border border-[rgb(239,206,191)] rounded-lg mt-3 px-4 py-3 bg-[rgb(253,246,244)]">
                <div className="flex flex-row items-center gap-3">
                    <div className="bg-white rounded-4xl p-3">
                        <MdPeopleOutline size={22} className="text-[rgb(203,84,51)]" />
                    </div>

                    <div >
                        <p className="text-stone-800">Friend Requests (2)</p>
                        <p className="text-[rgb(137,122,114)] text-sm">People who want to connect</p>
                    </div>

                </div>

                <div className="flex flex-row items-center gap-3 bg-white rounded-lg py-2 shadow-sm justify-between px-5">
                    <div className="flex flex-row gap-3 items-center">
                        {/* Profile pic placeholder */}
                        <div className="bg-white rounded-4xl p-3">
                            <MdPeopleOutline />
                        </div>

                        <div >
                            <p className="text-stone-800">Olivia Park</p>
                            <p className="text-[rgb(137,122,114)] text-sm">3 mutual friends | 3 hours ago</p>
                        </div>
                    </div>

                    <div className="flex flex-row gap-3" >
                        <button className="px-4 py-2 text-sm text-white border rounded-lg bg-[rgb(203,84,51)]">+</button>
                        <button className="px-4 py-2 text-sm text-stone-800 border border-stone-300 rounded-lg bg-[rgb(248,245,242)]">-</button>
                    </div>
                </div>

                <div className="flex flex-row items-center gap-3 bg-white rounded-lg py-2 shadow-sm justify-between px-5">
                    <div className="flex flex-row gap-3 items-center">
                        {/* Profile pic placeholder */}
                        <div className="bg-white rounded-4xl p-3">
                            <MdPeopleOutline />
                        </div>

                        <div >
                            <p className="text-stone-800">Tom Walker</p>
                            <p className="text-[rgb(137,122,114)] text-sm">2 mutual friends | 5 days ago</p>
                        </div>
                    </div>

                    <div className="flex flex-row gap-3" >
                        <button className="px-4 py-2 text-sm text-white border rounded-lg bg-[rgb(203,84,51)]">+</button>
                        <button className="px-4 py-2 text-sm text-stone-800 border border-stone-300 rounded-lg bg-[rgb(248,245,242)]">-</button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-row gap-3 bg-[rgb(237,232,228)] rounded-lg px-3 py-2 justify-start items-center w-max">
                <button
                    className={`py-2 px-3 rounded-lg hover:cursor-pointer ${activeTab === "friends"
                        ? "bg-white text-stone-700"
                        : "text-stone-700"}`}
                    onClick={() => setActiveTab("friends")}
                >
                    Friends
                </button>
                <button
                    className={`py-2 px-3 rounded-lg hover:cursor-pointer ${activeTab === "feed"
                        ? "bg-white text-stone-700"
                        : "text-stone-700"}`}
                    onClick={() => setActiveTab("feed")}
                >
                    Feed
                </button>
                <button
                    className={`py-2 px-3 rounded-lg hover:cursor-pointer ${activeTab === "sent"
                        ? "bg-white text-stone-700"
                        : "text-stone-700"}`}
                    onClick={() => setActiveTab("sent")}
                >
                    Sent
                </button>
            </div>

            {/* Friends Tab Content */}
            {activeTab === "friends" && (
                <div className="flex flex-col gap-4">
                    <input
                        type="text"
                        className="border border-stone-200 rounded-lg px-3 py-2 w-full focus:outline-[rgb(203,84,51)]"
                        placeholder="Search friends..."
                    />

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        <FriendsCard />
                        <FriendsCard />
                        <FriendsCard />
                    </div>
                </div>
            )}

            {/* Feed Tab Content  */}
            {activeTab === "feed" && (
                <div>
                    <p className="text-[rgb(137,122,114)] text-sm mb-3">
                        Recent entries from your friends
                    </p>
                    <div className="flex flex-col gap-4">
                        <FriendsReviewCard />
                        <FriendsReviewCard />
                        <FriendsReviewCard />
                    </div>
                </div>
            )}


            {/* Sent Tab Content */}
            {activeTab === "sent" && (
                <div>
                    <SentRequestCard />
                </div>
            )}

        </div>
    )
}