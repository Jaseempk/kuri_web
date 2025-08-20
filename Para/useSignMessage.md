# useSignMessage

> Hook for signing messages with a wallet

export const MethodDocs = ({name, description, parameters = [], returns, deprecated = false, since = null, async = false, static: isStatic = false, tag = null, defaultExpanded = false, id = 'method'}) => {
const [isExpanded, setIsExpanded] = useState(defaultExpanded);
const [isHovered, setIsHovered] = useState(false);
const [isCopied, setIsCopied] = useState(false);
const [hoveredParam, setHoveredParam] = useState(null);
const [hoveredReturn, setHoveredReturn] = useState(false);
const parseMethodName = fullName => {
const match = fullName.match(/^([^(]+)(\()([^)]\*)(\))$/);
if (match) {
return {
name: match[1],
openParen: match[2],
params: match[3],
closeParen: match[4]
};
}
return {
name: fullName,
openParen: '',
params: '',
closeParen: ''
};
};
const methodParts = parseMethodName(name);
const handleCopy = e => {
e.stopPropagation();
navigator.clipboard.writeText(name);
setIsCopied(true);
setTimeout(() => setIsCopied(false), 2000);
};
return <div className={`not-prose rounded-2xl border border-gray-200 overflow-hidden transition-colors duration-200 mb-6 ${isHovered ? 'bg-gray-50' : 'bg-white'}`} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
<button onClick={() => setIsExpanded(!isExpanded)} className="w-full bg-transparent p-6 border-none text-left cursor-pointer">
<div className="flex items-start justify-between gap-4">
<div className="flex-1 flex flex-col gap-2">
<div className="flex items-center gap-3 flex-wrap">
<div className="flex items-center gap-2">
{async && <span className="px-1.5 py-0.5 text-[0.625rem] font-medium bg-purple-200 text-purple-800 rounded-lg">
async
</span>}
{isStatic && <span className="px-1.5 py-0.5 text-[0.625rem] font-medium bg-violet-200 text-violet-900 rounded-lg">
static
</span>}
{tag && <span className="px-1.5 py-0.5 text-[0.625rem] font-medium bg-teal-200 text-teal-800 rounded-lg">
{tag}
</span>}
</div>

              <code className="text-lg font-mono font-semibold text-gray-900">
                <span>{methodParts.name}</span>
                <span className="text-gray-500 font-normal">{methodParts.openParen}</span>
                <span className="text-blue-600 font-normal">{methodParts.params}</span>
                <span className="text-gray-500 font-normal">{methodParts.closeParen}</span>
              </code>

              {deprecated && <span className="px-1.5 py-0.5 text-[0.625rem] font-medium bg-red-100 text-red-800 rounded-lg flex items-center gap-0.5">
                  ⚠ Deprecated
                </span>}
              {since && <span className="px-1.5 py-0.5 text-[0.625rem] font-medium bg-blue-100 text-blue-800 rounded-lg">
                  Since v{since}
                </span>}
            </div>

            <p className="text-sm text-gray-600 leading-6 m-0">
              {description}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleCopy} className="p-2 bg-transparent border-none rounded-md cursor-pointer transition-colors duration-200 text-gray-500 hover:bg-gray-100" title="Copy method signature">
              {isCopied ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>}
            </button>

            <span className="text-gray-400">
              {isExpanded ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>}
            </span>
          </div>
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out px-6 border-t border-gray-200 ${isExpanded ? 'max-h-[2000px] opacity-100 pb-6' : 'max-h-0 opacity-0 pb-0'}`}>
        {parameters.length > 0 && <div className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider m-0">
                Parameters
              </h3>
              <span className="text-xs text-gray-500">({parameters.length})</span>
            </div>
            <div>
              {parameters.map((param, index) => <div key={index} className={`pl-4 border-l-2 transition-colors duration-200 ${hoveredParam === index ? 'border-gray-300' : 'border-gray-200'} ${index < parameters.length - 1 ? 'mb-3' : ''}`} onMouseEnter={() => setHoveredParam(index)} onMouseLeave={() => setHoveredParam(null)}>
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <code className="font-mono text-sm font-medium text-gray-900">
                      {param.name}
                    </code>
                    <span className="text-sm text-gray-500">:</span>
                    <code className="font-mono text-sm text-blue-600 bg-transparent px-1 py-0.5 rounded-md cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:text-blue-700">
                      {param.type}
                    </code>
                    {param.required && <span className="px-1.5 py-0.5 text-[0.625rem] font-medium bg-yellow-100 text-yellow-800 rounded-lg">
                        Required
                      </span>}
                    {param.optional && <span className="px-1.5 py-0.5 text-[0.625rem] font-medium bg-gray-100 text-gray-600 rounded-lg">
                        Optional
                      </span>}
                  </div>
                  {param.description && <p className="text-sm text-gray-600 mt-1 mb-0">
                      {param.description}
                    </p>}
                  {param.defaultValue !== undefined && <p className="text-sm text-gray-500 mt-1">
                      Default: <code className="font-mono text-[0.625rem] bg-gray-100 px-1.5 py-0.5 rounded-lg">{param.defaultValue}</code>
                    </p>}
                </div>)}
            </div>
          </div>}

        {returns && <div className={`${parameters.length > 0 ? 'mt-6' : 'pt-6'}`}>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider m-0 mb-3">
              Returns
            </h3>
            <div className={`pl-4 border-l-2 transition-colors duration-200 ${hoveredReturn ? 'border-gray-300' : 'border-gray-200'}`} onMouseEnter={() => setHoveredReturn(true)} onMouseLeave={() => setHoveredReturn(false)}>
              <div className="flex items-baseline gap-2 mb-1">
                <code className="font-mono text-sm text-blue-600 bg-transparent px-1 py-0.5 rounded cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:text-blue-700">
                  {returns.type}
                </code>
              </div>
              {returns.description && <p className="text-sm text-gray-600 mt-1 mb-0">
                  {returns.description}
                </p>}
            </div>
          </div>}
      </div>
    </div>;

};

export const Card = ({imgUrl, title, description, href, horizontal = false, newTab = false}) => {
const [isHovered, setIsHovered] = useState(false);
const baseImageUrl = "https://mintlify.s3-us-west-1.amazonaws.com/getpara";
const handleClick = e => {
e.preventDefault();
if (newTab) {
window.open(href, '\_blank', 'noopener,noreferrer');
} else {
window.location.href = href;
}
};
return <div className={`not-prose relative my-2 p-[1px] rounded-xl transition-all duration-300 ${isHovered ? 'bg-gradient-to-r from-[#FF4E00] to-[#874AE3]' : 'bg-gray-200'}`} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
<a href={href} onClick={handleClick} className={`not-prose flex ${horizontal ? 'flex-row' : 'flex-col'} font-normal h-full bg-white overflow-hidden w-full cursor-pointer rounded-[11px] no-underline`}>
{imgUrl && <div className={`relative overflow-hidden flex-shrink-0 ${horizontal ? 'w-[30%] rounded-l-[11px]' : 'w-full'}`} onClick={e => e.stopPropagation()}>
<img src={`${baseImageUrl}${imgUrl}`} alt={title} className="w-full h-full object-cover pointer-events-none select-none" draggable="false" />
<div className="absolute inset-0 pointer-events-none" />
</div>}
<div className={`flex-grow px-6 py-5 ${horizontal ? 'w-[70%]' : 'w-full'} flex flex-col ${horizontal && imgUrl ? 'justify-center' : 'justify-start'}`}>
{title && <h2 className="font-semibold text-base text-gray-800 m-0">{title}</h2>}
{description && <div className={`font-normal text-gray-500 re leading-6 ${horizontal || !imgUrl ? 'mt-0' : 'mt-1'}`}>
<p className="m-0 text-xs">{description}</p>
</div>}
</div>
</a>
</div>;
};

export const Link = ({href, label}) => {
const [isHovered, setIsHovered] = useState(false);
return <a href={href} className="not-prose inline-block relative text-black font-semibold cursor-pointer border-b-0 no-underline" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
{label}
<span className={`absolute left-0 bottom-0 w-full rounded-sm bg-gradient-to-r from-orange-600 to-purple-600 transition-all duration-300 ${isHovered ? 'h-0.5' : 'h-px'}`} />
</a>;
};

The `useSignMessage` hook provides functionality to sign arbitrary messages with the user's wallet.

## Import

```tsx
import { useSignMessage } from "@getpara/react-sdk@alpha";
```

## Usage

```tsx
function MessageSigner() {
  const { signMessage, signMessageAsync, isPending, error } = useSignMessage();
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState("");

  const handleSign = async () => {
    try {
      const result = await signMessageAsync({
        messageBase64: Buffer.from(message).toString("base64"),
      });

      if ("signature" in result) {
        setSignature(result.signature);
      }
    } catch (err) {
      console.error("Failed to sign message:", err);
    }
  };

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter message to sign"
      />

      <button onClick={handleSign} disabled={isPending || !message}>
        {isPending ? "Signing..." : "Sign Message"}
      </button>

      {signature && <p>Signature: {signature}</p>}
    </div>
  );
}
```

<MethodDocs
name="useSignMessage()"
description="React Query mutation hook for signing arbitrary messages with the user's wallet. Returns both sync and async functions for message signing along with mutation state."
parameters={[]}
returns={{
  type: "UseMutationResult<SignMessageResponse, Error, SignMessageParams>",
  description: "React Query mutation result with signMessage/signMessageAsync functions, loading state, error information, and signature data on success"
}}
async={true}
/>
