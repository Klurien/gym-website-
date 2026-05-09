import React from 'react';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export default function RichText({ text, className = "" }) {
  if (!text) return null;

  const parts = text.split(URL_REGEX);

  return (
    <p className={`whitespace-pre-wrap ${className}`}>
      {parts.map((part, i) => {
        if (part.match(URL_REGEX)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="rich-text-link"
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </p>
  );
}
