Gemini Code Assist: Practical Tips & Tricks for Developers
Matt
Matt
7 min read
·
Oct 1, 2024

Press enter or click to view image in full size

Generative code tools have had the spotlight in the developer community for some time now. Having seen and used these tools for well over a year now, my hot take is that instead of replacing developers, these tools are better seen as a way to support and enhance development.

The real power of AI code assist lies in its ability to keep you in your coding flow by reducing the need to jump between tabs for documentation, automating common development tasks, and to expand your view on how to solve problems.

LLMs (Large Language Models) are fast, but they’re also very noisy. You need to keep the big picture and final destination for your project in mind to be able to quickly identify what is taking you down the right path and what isn’t, i.e. “AI slop”.

In this guide, we’ll explore practical tips for getting the most out of AI tools like Gemini Code Assist (for a comparison between Gemini Code Assist and GitHub Copilot check out my other post here), looking at how to optimise prompts, manage context & how to use these tools for refactoring and rapidly prototyping new ideas. These insights should help you integrate Code Assist into your daily development process more effectively.
Prompting

Let’s start by talking about prompting. This section focuses on how to effectively interact with LLMs through the “chat windows” we often see in code assist tools like Gemini Code Assist. Some of these principles can also be applied when writing code or comments directly in your editor.

While we’ve been encouraged to interact with AI like we would with another person, I’ve found that it’s not always necessary to focus on perfect sentence structure. Don’t waste time trying to craft full sentences and don’t fret the grammar or punctuation; the AI won’t judge you for it!

If you can, copy and paste code into these prompts — it’s more precise and easier for the model to interpret than referencing. Again, don’t worry about the formatting or structure; aim for speed. Structured data like JSON, XML, or even markdown-style syntax (e.g. asterisks for emphasis) works well too. Whatever format best clarifies your intentions, use it. This can significantly streamline your interactions.

Additionally, how you respond to responses can steer the conversation. When it gives you a particularly helpful answer, let it know. Reinforcing successful exchanges helps align the model with your direction and ensures suggestions stay relevant.
Context is Key™

When using LLMs, context is like adjusting the dials on a control panel — you control how effectively the model understands and responds.

For code assist, the surrounding code serves as the model’s prompt, and by fine-tuning the context you provide, you can greatly improve the quality of suggestions.

Here are a few ways to improve your use of the context window in your code editor:

    Add Comments: Use comments to describe what each part of your code is meant to do. Not only does this help the model, but it also serves as a useful reference for you later on (✨best practices✨). This becomes even more valuable if you refactor your code using AI later.
    Use Meaningful Names: Descriptive variable and function names can give clues about your code’s purpose, improving the relevance of suggestions. Even simple verb-noun patterns in function names (e.g., getUser, updatePost) provide enough context for generating decent boilerplate for common function patterns.
    Break Down Steps: Simplify your logic into smaller, clearly defined steps. LLMs are especially effective at handling isolated logic, much like code that could easily be unit tested. Once the smaller pieces are solid, you can scale up and integrate them into the larger codebase.
    Include Superfluous Code: Adding snippets of commented but relevant code can give the model a sense of where you’re heading. For example, if you’re implementing some algorithm, include a commented-out version from another language or a related example. You don’t need to worry about the finer details; you can clean things up once it has generated something useful. Just be sure to remove unnecessary comment blocks when you’re done!

The context window is powerful, but it can often become cluttered with irrelevant information, which dilutes the quality of the suggestions. Keeping the context focused and relevant is key to receiving the most accurate and helpful outputs.
Become a Medium member

Here are some quick tips for effectively managing context for both chat and inline code:

    Start Fresh When Needed: When in chat, if the model starts providing less relevant suggestions, don’t hesitate to start a new session or clear the context. This helps reset the focus and ensures that the model’s responses stay aligned with your current task when the conversation starts to drift. You can quickly copy and paste a large portion of the previous session to get back up to speed.
    Keep Logic Isolated: In the editor, keep separate logic in isolated files or subdirectories. This prevents the model from getting overwhelmed by unrelated code and helps it stay focused on the specific task. It’s also a good organisational habit in general (✨best practices✨).

By refining the context you provide, the model can better match your coding style, making suggestions that are more aligned with your habits and requirements. This approach turns Gemini and other code assist tools into powerful autocomplete engines, allowing you to iterate on code faster.
Refactoring with AI

One of the most promoted use cases for generative code tools is for refactoring. AI can offer insights that make your code more efficient and maintainable. Here’s how to get the most out of this feature:

    Optimising Code: Ask for performance improvements, such as optimising loops, reducing redundancy, or using better data structures. You might discover framework-specific features or more efficient approaches you hadn’t considered.
    Restructuring Code for Readability: Use it to simplify complex logic or refactor large chunks of code, making it easier to follow. This can be especially helpful before a review, acting as a second set of eyes to improve both readability and maintainability.
    Educational: Refactoring with AI can be a great learning tool. Comparing its suggestions to your own can highlight outdated habits and introduce more modern approaches. For instance, I rarely used some of the more obscure native JavaScript Promise methods to optimise asynchronous tasks, but after seeing them in several examples, I quickly understood their use cases and began using them in my own projects.

Refactoring with AI can improve the quality and maintainability of your projects while helping you spot inefficiencies or opportunities for improvement — both in your code and in your coding habits.
The Dreaded Blank Screen

We’ve all faced that moment of staring at an empty screen, unsure where to begin — whether it’s an essay or a piece of code.

With Gemini, you can quickly get past that initial block by asking it to draft a basic function or component. It won’t always (or rarely) be exactly what you’re looking for, but it gets you moving.

As mentioned, these tools aren’t always accurate, but they’re very fast, learn to quickly generate code and navigate around the noise.

This initial output provides something to build on. You can then refine, refactor, and iterate, allowing you to explore the solution space and consider different approaches to solving a problem right out of the gate. The process of refining the model’s suggestions can also help surface requirements or limitations you might not have initially considered.
Using AI as a “Rubber Duck”
Rubber duck assisting with debugging

To the uninitiated, Rubber duck debugging is a well known method in software development where a programmer explains their code out loud, often to an inanimate object like a rubber duck, to work through problems and clarify their thoughts. The act of explaining helps reveal issues that might not be immediately obvious.

With Code Assist tools, you can take this approach further. Instead of just listening, the tool can provide feedback and offer potential solutions, improving your debugging process.

For example, when designing a complex database schema, I had all my tables and relationships laid out but felt uneasy about some of the design decisions. Instead of spending hours scouring articles and documentation, I asked Gemini for its thoughts. Within minutes, I had a conversation that gave me peace of mind and some helpful tweaks. While I didn’t implement everything it suggested, it helped me clarify my thinking and avoid potential pitfalls.

The advantage of using LLMs in this way is that you get instant feedback without spending time searching for information. While the model won’t always give perfect solutions, it can surface ideas and questions that guide you to better decisions. Just keep in mind that LLMs in general tend to be overly agreeable and optimistic, so as always, remain critical of suggestions.
