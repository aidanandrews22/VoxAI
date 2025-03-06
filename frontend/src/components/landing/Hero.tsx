import { useAuth } from "@clerk/clerk-react";

const Hero: React.FC = () => {
    const { isSignedIn } = useAuth();
    return (
        <section className="flex flex-col items-center text-center relative z-2">
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 gradient-primary-to-sky bg-clip-text text-transparent">
            Transform Learning Through
            <br />
            Intelligent AI
        </h1>
        <p className="text-xl color-secondary max-w-2xl mb-10 leading-relaxed">
            Voxed AI combines advanced artificial intelligence with educational
            expertise to create a personalized learning experience. Take notes,
            write code, and learn faster with our intelligent assistant.
        </p>
        <a
            href={isSignedIn ? "/notebooks" : "/sign-in"}
            className="bg-gradient-to-br from-sky-400 to-indigo-400 color-primary border-none py-3 px-6 rounded-lg font-semibold cursor-pointer transition duration-200 hover:translate-y-[-2px] hover:shadow-lg shadow-adaptive no-underline"
        >
            Get Started For Free
        </a>
        </section>
    );
};

export default Hero;