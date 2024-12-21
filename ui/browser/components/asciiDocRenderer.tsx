import React from "react";
import Asciidoctor from "asciidoctor";

const asciidoctor = Asciidoctor();

interface AsciiDocRendererProps {
    content: string;
}

const AsciiDocRenderer: React.FC<AsciiDocRendererProps> = ({ content }) => {
    const renderedHtml = asciidoctor.convert(content, { safe: "safe" });
    return <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />;
};

export default AsciiDocRenderer;
