const CodeMockup: React.FC = () => {
    return (
      <div className="bg-secondary backdrop-blur-lg rounded-xl overflow-hidden shadow-adaptive border border-adaptive">
        <div className="bg-primary p-3 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
  
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
  
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
        </div>
  
        <div className="p-6 h-[300px] flex flex-col">
          <div className="font-mono text-sm color-primary leading-relaxed">
            <span className="text-purple-400">function</span>{" "}
            <span className="text-sky-400">calculateLearningRate</span>(
            <span className="text-purple-400">const</span> progress, difficulty)
            &#123;
            <br />
            &nbsp;&nbsp;
            <span className="color-muted">// Adaptive learning algorithm</span>
            <br />
            &nbsp;&nbsp;<span className="text-purple-400">const</span> baseRate =
            0.01;
            <br />
            &nbsp;&nbsp;<span className="text-purple-400">const</span>{" "}
            adaptiveFactor = progress / (difficulty + 1);
            <br />
            &nbsp;&nbsp;<span className="text-purple-400">return</span> baseRate *
            (1 + adaptiveFactor);
            <br />
            &#125;
            <br />
            <br />
            <span className="text-purple-400">class</span>{" "}
            <span className="text-sky-400">LearningModel</span> &#123;
            <br />
            &nbsp;&nbsp;<span className="text-sky-400">constructor</span>
            (userData) &#123;
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">this</span>
            .userData = userData;
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">this</span>
            .learningRate = 0.01;
            <br />
            &nbsp;&nbsp;&#125;
            <br />
            <br />
            &nbsp;&nbsp;<span className="text-sky-400">updateModel</span>() &#123;
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">
              const
            </span>{" "}
            newRate = calculateLearningRate(
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <span className="text-purple-400">this</span>.userData.progress,
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <span className="text-purple-400">this</span>.userData.difficulty
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;);
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">this</span>
            .learningRate = newRate;
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;
            <span className="color-muted">
              // AI suggests: Consider adding momentum for faster convergence
            </span>
            <br />
            &nbsp;&nbsp;&#125;
            <br />
            &#125;
          </div>
        </div>
      </div>
    );
};

export default CodeMockup;