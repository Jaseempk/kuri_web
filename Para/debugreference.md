# React with Vite

> Overcoming Para integration challenges in Vite-powered React applications

export const Link = ({href, label}) => {
const [isHovered, setIsHovered] = useState(false);
return <a href={href} className="not-prose inline-block relative text-black font-semibold cursor-pointer border-b-0 no-underline" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
{label}
<span className={`absolute left-0 bottom-0 w-full rounded-sm bg-gradient-to-r from-orange-600 to-purple-600 transition-all duration-300 ${isHovered ? 'h-0.5' : 'h-px'}`} />
</a>;
};

Vite's approach to building React applications can introduce unique considerations when integrating Para. This guide
addresses frequent issues and offers tailored solutions to ensure a successful implementation.

<Tip>
  Using an LLM (ChatGPT, Claude) or Coding Assistant (Cursor, Github Copilot)? Here are a few tips:

1. Include the <Link label="Para LLM-optimized context file" href="https://docs.getpara.com/llms-full.txt" /> to ensure you're getting the most up-to-date help!
2. Check out the <Link label="Example Hub Wiki" href="https://deepwiki.com/getpara/examples-hub" /> for an interactive LLM that leverages the Para Examples Hub!
   </Tip>

## General Troubleshooting Steps

Before diving into specific issues, try these general troubleshooting steps:

<AccordionGroup>
  <Accordion title="Clear cache and node_modules">`bash rm -rf node_modules npm cache clean --force `</Accordion>
  <Accordion title="Reinstall dependencies">`bash npm install `</Accordion>
  <Accordion title="Update Para-related packages">`bash npm update @getpara/react-sdk@alpha `</Accordion>
  <Accordion title="Rebuild the project">`bash npm run build `</Accordion>
</AccordionGroup>

## Common Issues and Solutions

<AccordionGroup>
  <Accordion title="Missing Node.js Polyfills">
    **Problem**: Vite doesn't include Node.js polyfills by default, which can cause issues with packages that depend on Node.js built-ins like `buffer` or `crypto`.

    **Solution**: Add the necessary polyfills using the `vite-plugin-node-polyfills` plugin. Adjust the configuration as needed for your specific requirements:

    1. Install the plugin:
       ```bash
       npm install --save-dev vite-plugin-node-polyfills
       ```

    2. Update your `vite.config.js`:
       ```javascript
       import { defineConfig } from "vite";
       import react from "@vitejs/plugin-react";
       import { nodePolyfills } from "vite-plugin-node-polyfills";

       export default defineConfig({
         plugins: [
           react(),
           nodePolyfills({
             include: ["buffer", "crypto", "stream", "util"],
           }),
         ],
         // ... other configurations
       });
       ```

  </Accordion>

  <Accordion title="Environment Variables Not Accessible">
    **Problem**: Environment variables not being recognized in your application.

    **Solution**: Ensure you're prefixing your environment variables with `VITE_` and accessing them correctly:

    1. In your `.env` file:
       ```
       VITE_PARA_API_KEY=your_api_key_here
       ```

    2. In your code:
       ```javascript
       const para = new Para(Environment.BETA, import.meta.env.VITE_PARA_API_KEY);
       ```

  </Accordion>

  <Accordion title="CSS Loading Issues">
    **Problem**: Para's CSS files not loading correctly.

    **Solution**: Import Para's CSS file in your main `App.jsx` or `index.jsx`:

    ```jsx
    import "@getpara/react-sdk/dist/index.css@alpha";

    function App() {
      // Your app code
    }

    export default App;
    ```

  </Accordion>
</AccordionGroup>

### Best Practices

1. **Use the Latest Versions**: Always use the latest versions of Vite, React, and Para SDK to ensure compatibility and
   access to the latest features.

2. **Error Handling**: Implement error boundaries to gracefully handle any runtime errors related to Para integration.

3. **Development vs Production**: Use environment-specific configurations to manage different settings for development
   and production builds. Para provides environment-specific API keys.

By following these troubleshooting steps and best practices, you should be able to resolve most common issues when
integrating Para with your React application using Vite.

### Integration Support

If you're experiencing issues that aren't resolved by our troubleshooting resources, please contact our team for
assistance. To help us resolve your issue quickly, please include the following information in your request:

<ol className="space-y-4 list-none pl-0">
  <li className="flex items-start">
    <span className="w-7 h-7 shrink-0 rounded-lg bg-gray-100 mr-2 mt-0.5 dark:text-white dark:bg-[#26292E] text-sm text-gray-800 font-semibold flex items-center justify-center">
      1
    </span>

    <p className="flex-1 my-0">A detailed description of the problem you're encountering.</p>

  </li>

  <li className="flex items-start">
    <span className="w-7 h-7 shrink-0 rounded-lg bg-gray-100 mr-2 mt-0.5 dark:text-white dark:bg-[#26292E] text-sm text-gray-800 font-semibold flex items-center justify-center">
      2
    </span>

    <p className="flex-1 my-0">Any relevant error messages or logs.</p>

  </li>

  <li className="flex items-start">
    <span className="w-7 h-7 shrink-0 rounded-lg bg-gray-100 mr-2 mt-0.5 dark:text-white dark:bg-[#26292E] text-sm text-gray-800 font-semibold flex items-center justify-center">
      3
    </span>

    <p className="flex-1 my-0">Steps to reproduce the issue.</p>

  </li>

  <li className="flex items-start">
    <span className="w-7 h-7 shrink-0 rounded-lg bg-gray-100 mr-2 mt-0.5 dark:text-white dark:bg-[#26292E] text-sm text-gray-800 font-semibold flex items-center justify-center">
      4
    </span>

    <p className="flex-1 my-0">Details about your system or environment (e.g., device, operating system, software version).</p>

  </li>
</ol>

Providing this information will enable our team to address your concerns more efficiently.
