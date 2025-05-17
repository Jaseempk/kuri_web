import DOMPurify from "dompurify";

export const sanitizeInput = (input: string): string => {
  if (!input) return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "em", "strong"],
    ALLOWED_ATTR: [], // restrict attributes
  });
};

export const sanitizeHtml = (html: string): string => {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "b", "i", "em", "strong", "a", "ul", "li"],
    ALLOWED_ATTR: ["href"], // only allow href for links
  });
};
