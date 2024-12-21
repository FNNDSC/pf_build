import React from "react";
import AsciiDocRenderer from "./asciiDocRenderer";

interface CompletionMessageProps {
    asciidoc: string;
}

const CompletionMessage: React.FC<CompletionMessageProps> = ({ asciidoc }) => (
    <div className="completion-message">
        <AsciiDocRenderer content={asciidoc} />
    </div>
);

export default CompletionMessage;
