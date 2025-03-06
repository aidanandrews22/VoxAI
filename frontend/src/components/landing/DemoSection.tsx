import CodeMockup from "./CodeMockup";
import { useAuth } from "@clerk/clerk-react";

const DemoSection: React.FC = () => {
    const { isSignedIn } = useAuth();
    return (
      <section className="py-20 relative z-2">
        <div className="flex flex-col md:flex-row items-center gap-12 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <h2 className="text-4xl font-bold mb-6 gradient-primary-to-indigo bg-clip-text text-transparent">
              Supercharge Your Coding Skills
            </h2>
  
            <p className="color-secondary leading-relaxed mb-8">
              Our AI code assistant helps you learn programming faster by
              providing intelligent suggestions, explaining complex concepts, and
              debugging your code in real-time. Whether you're a beginner or
              advanced programmer, Voxed AI accelerates your coding journey.
            </p>
  
            <a
              href={isSignedIn ? "/notebooks" : "/sign-in"}
              className="bg-gradient-to-br from-sky-400 to-indigo-400 color-primary border-none py-3 px-6 rounded-lg font-semibold cursor-pointer transition duration-200 hover:translate-y-[-2px] hover:shadow-lg shadow-adaptive no-underline"
            >
              Try Code Assistant
            </a>
          </div>
  
          <div className="flex-1 min-w-[300px]">
            <CodeMockup />
          </div>
        </div>
      </section>
    );
};

export default DemoSection;