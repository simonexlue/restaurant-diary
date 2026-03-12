import image from "../assets/auth-hero.jpg";

export default function Login() {
    return (
        <div className="relative min-h-screen w-screen bg-stone-100 xl:flex xl:flex-row">
            {/* Background image for small/md/lg */}
            <div className="absolute inset-0 xl:hidden">
                <img src={image} className="h-full w-full object-cover" />
            </div>

            {/* Left image side for xl+ */}
            <div className="hidden xl:block xl:w-1/2">
                <img src={image} className="h-screen w-full object-cover" />
            </div>

            {/* Form side */}
            <div className="relative z-10 flex min-h-screen w-full items-center justify-center xl:w-1/2 xl:bg-stone-100">
                <div className="w-[85%] max-w-md rounded-xl bg-stone-100 p-8 shadow-lg sm:w-[75%] md:w-[65%] lg:w-[55%] xl:w-[75%] xl:max-w-none xl:rounded-none xl:bg-transparent xl:p-0 xl:shadow-none">
                    <h4 className="mb-0 sm:mb-3 text-left text-3xl font-semibold text-stone-700">
                        Welcome Back
                    </h4>

                    <p className="hidden sm:block sm:mb-3 text-md text-stone-500">Sign in to continue</p>

                    <div className="mb-3 h-4 w-full border-b border-stone-300" />

                    <form className="mt-5 flex flex-col">
                        <div className="mb-4">
                            <label className="mb-2 block text-stone-700">Email</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 focus:outline-[rgb(203,84,51)]"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="mb-2 block text-stone-700">Password</label>
                            <input
                                type="password"
                                placeholder="********"
                                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 focus:outline-[rgb(203,84,51)] hover:cursor-pointer"
                            />
                        </div>

                        <button className="mb-4 h-10 rounded-md bg-[rgb(203,84,51)] py-2 text-sm text-white">
                            Sign In
                        </button>

                        <div className="mt-4 flex justify-center gap-1 text-stone-500">
                            <p>Don't have an account?</p>
                            <a href="/" className="text-[rgb(203,84,51)]">
                                Sign up
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}