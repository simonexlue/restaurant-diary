import image from "../assets/auth-hero.jpg";

export default function Login() {
    return (
        <div className="w-screen h-screen flex flex-row bg-stone-100">
            {/* Image side */}
            <div className="w-1/2">
                <img className="object-cover h-screen" src={image} />
            </div>


            {/* Login side */}
            <div className="w-1/2 flex flex-col justify-center items-center ">
                <div className="w-2/3">
                    <h4 className="text-3xl font-semibold text-left mb-3 text-stone-700">Welcome Back</h4>
                    <p className="text-stone-500 text-md mb-3">Sign in to continue</p>

                    <div className="border-b-1 border-stone-300 h-4 w-full mb-3" />

                    {/* Form */}
                    <form className="flex flex-col mt-10">
                        <div className="mb-4">
                            <label className="block text-stone-700 mb-2">
                                Email
                            </label>
                            <input type="email" placeholder="you@example.com" className="border border-gray-300 rounded-md w-full h-10 bg-white px-3" />
                        </div>


                        <div className="mb-6">
                            <label className="block text-stone-700 mb-2">
                                Password
                            </label>
                            <input type="password" placeholder="********" className="border border-gray-300 rounded-md w-full h-10 bg-white px-3" />
                        </div>

                        <button className="bg-[rgb(203,84,51)] rounded-md text-white text-sm py-2 mb-4 h-10">Sign In</button>

                        <div className="text-stone-500 flex gap-1 justify-center mt-4">
                            <p>Don't have an account?</p>
                            <a href="/" className="text-[rgb(203,84,51)]">Sign up free</a>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    )
}
