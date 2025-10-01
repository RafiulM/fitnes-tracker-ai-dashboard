# App Flow Document

# App Flow Document

## Onboarding and Sign-In/Sign-Up

A new user first encounters a clean landing page when they navigate to the web app URL. The landing page highlights the fitness tracker chatbot and prompts the visitor to either sign up or sign in. When the user clicks Sign Up, they are presented with a simple form requesting an email address and password. After entering those details and submitting, Clerk.js handles the account creation behind the scenes, sending a confirmation email if required and then redirecting the user to the chat interface. Returning users choose Log In instead, enter their email and password, and Clerk verifies their credentials. If a user forgets their password, a Forgot Password link appears on the login form. Clicking that link prompts the user to enter their email and then sends a password reset email. Upon clicking the reset link in the email, the user lands on a secure page where they can choose a new password. Once authentication succeeds, users land on the primary chat page without further prompts. A persistent Logout option sits in the top navigation, allowing signed-in users to end their session and return to the landing page.

## Main Dashboard or Home Page

After signing in, users arrive first at the chat interface, which serves as the home page. The top of the screen displays a header bar with the app logo on the left and navigation links on the right labeled Chat, Dashboard, and Profile. The red accent primary color highlights the active link. Below the header, the chat window fills most of the view. Each message from the AI assistant appears in a styled chat bubble on the left, and the user’s messages appear on the right. A text input field at the bottom invites the user to type entries like weight or workout details. The user can switch to the Dashboard view by clicking the Dashboard link in the header. When the Dashboard is active, the header remains visible while the main area displays charts and tables. A sidebar is not used in version one. The same header navigation controls switching between chat, dashboard, and profile pages. All pages share a consistent red-accented theme and adjust seamlessly for desktop or tablet screens.

## Detailed Feature Flows and Page Transitions

When the user types a message into the chat input and presses Enter, the Next.js front end sends the raw text to a serverless API route at `/api/chat/route.ts`. That route includes the user’s Clerk authentication token to confirm identity, then passes the text to the ai-sdk. The ai-sdk processes the input, extracts data points such as weight, body fat percentage, workout type, sets, reps, or meal description, and returns a structured payload. The API route then writes this payload into Supabase tables under the user’s ID. After saving, the server returns a confirmation message back through the API, which the front end renders as a chat bubble from the assistant. If the user wishes to review past entries or see insights, they click the Dashboard link. The Dashboard page fetches the user’s logged data from Supabase and displays a line chart of weight over time, a bar chart of workout volume, and a table of meals with estimated calories. The user can filter these views by date range using dropdown controls styled in red. If the user wants a new workout or diet plan, they click the Generate New Plan button on either the chat page or the dashboard. Clicking that button sends a chat-like request to the same API route, which triggers ai-sdk to create a custom plan based on the latest stats. The assistant then replies in the chat window with a day-by-day plan. Each plan is saved in a `plans` table in Supabase so that users can revisit previous plans by scrolling in chat or by returning to the dashboard and choosing a past plan from a list.

## Settings and Account Management

From any page, the user can click the Profile link in the header to open the Settings page. Here the user sees a form with fields for target weight, preferred measurement units (pounds or kilograms), and dietary restrictions. Below those fields, the user can switch between light and dark mode and confirm that the primary accent color remains red. As soon as a user updates any value and leaves the field, the change is sent to an API route that updates the corresponding record in Supabase. A Save or Confirm button is not required because changes persist immediately. A Logout button sits at the bottom of the Settings page to allow users to securely end their session and return to the landing page. After updating preferences, the user can click Chat or Dashboard in the header to return to the main app flow.

## Error States and Alternate Paths

If a user enters an invalid email or password during sign-in, Clerk displays a clear error message above the login fields explaining the issue. During password reset, if the email is not found, the user sees a notice that no account exists for that address. In the chat interface, if a user’s message cannot be parsed by the ai-sdk because it is too ambiguous or missing key details, the assistant replies asking for clarification, for example requesting a weight value or workout specifics. If Supabase or the API endpoint is temporarily unavailable, the front end shows an inline error banner in red at the top of the chat or dashboard page, explaining that there was a problem and providing a Retry button. Clicking Retry resends the last request. If the user attempts to navigate to Chat, Dashboard, or Settings without being authenticated, middleware redirects them to the login page. If the user loses Internet connectivity mid-session, the text input area is disabled and an offline notice appears until the connection is restored. Once connectivity returns, the interface automatically retries any unsent messages.

## Conclusion and Overall App Journey

A typical user journey begins with signing up using an email and password and landing directly in the chat interface. The user logs daily body stats, workouts, and meals simply by typing messages. Each entry triggers real-time parsing, storage, and confirmation in the chat stream. From chat, the user can switch to the dashboard at any time to visualize trends in weight, body fat percentage, workout volume, and calorie intake. Generating a new AI-driven workout or diet plan takes a single click or message, and the resulting plan appears in chat and is saved for later. Personal preferences and target goals are managed in Settings, with instant persistence and a consistent red accent theme. At any point, the user can log out and return later to pick right up where they left off without losing any data. Throughout the flow, clear error handling and authentication checks ensure that the experience remains smooth, private, and secure.


---
**Document Details**
- **Project ID**: 2d581913-6f01-4d83-a87d-eb24341aaf30
- **Document ID**: bd643d2c-b823-4e48-acf8-ff434638233b
- **Type**: custom
- **Custom Type**: app_flow_document
- **Status**: completed
- **Generated On**: 2025-10-01T12:04:21.230Z
- **Last Updated**: 2025-10-01T12:04:25.359Z
