import { useAuth } from '@clerk/clerk-react';

const CTASection: React.FC = () => {
    const { isSignedIn } = useAuth();
    return (
      <section className="py-20 text-center relative z-2">
        <h2 className="text-4xl font-bold mb-6 color-primary">
          Start Your Learning Journey Today
        </h2>
  
        <p className="color-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
          Join thousands of students and professionals who are transforming their
          learning experience with Voxed AI. Get started for free and unlock
          your full potential.
        </p>
  
        <div className="flex justify-center gap-4 flex-wrap">
          <a
            href={isSignedIn ? "/notebooks" : "/sign-in"}
            className="bg-gradient-to-br from-sky-400 to-indigo-400 color-primary border-none py-3 px-6 rounded-lg font-semibold cursor-pointer transition duration-200 hover:translate-y-[-2px] hover:shadow-lg shadow-adaptive no-underline"
          >
            Create Free Account
          </a>
  
          <a
            href="#"
            className="bg-secondary color-primary border border-adaptive py-3 px-6 rounded-lg font-semibold cursor-pointer transition-all duration-200 hover-bg-adaptive hover:translate-y-[-2px] no-underline"
          >
            Watch Demo
          </a>
        </div>
      </section>
    );
};

export default CTASection;