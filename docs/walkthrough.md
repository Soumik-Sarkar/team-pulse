# User walkthrough: from activity to personalized timing

This walkthrough uses the employee and manager demo accounts and follows the habit and administration flows.

1. **Sign in.** Open the app and sign in as `employee@teampulse.local` with `PulseDemo2026!`. The overview shows private habits, weekly progress, and team challenge progress.
2. **Create an activity.** Select **Add an activity**, enter “Take a 10-minute walk”, choose **Movement** and **Daily**, and save. The activity is owned by the signed-in account and private by default.
3. **Mark it done.** On the dashboard or **My habits**, select the check action. The API records a completion event once for the status transition, updates the streak, and creates a personal notification.
4. **Mark it missed.** Select the cross action for an activity and its status becomes missed; its current streak resets. This state change is also recorded in the event history.
5. **Review analytics.** Open **Analytics** to see personal totals and active streaks. These endpoints are scoped to the authenticated employee.
6. **Edit or remove an activity.** Open **My habits**, use the pencil action to change the title/type/cadence, or the trash action to remove the activity and its associated completion-event history. Confirm the removal prompt.
7. **Get a timing suggestion.** Open **Recommendations**. The API looks at the signed-in employee's completion hours and suggests the most common hour. With no history, it offers a clearly labeled starter suggestion.
8. **Accept the suggestion.** Select **Accept recommendation**. For an existing activity, the preferred time is saved to that activity. Accepting a starter suggestion creates a private activity in the employee's routine.
9. **Review team progress as a manager.** Sign out and sign in as `manager@teampulse.local`. The manager sees aggregated team metrics and challenge progress. The API does not return employees' activity names, records, or individual wellness history to manager endpoints.
10. **Use manager administration.** Open **Administration** to create, edit, or delete a team challenge and update team account roles. Open **Profile & settings** to update the manager display name or sign out. Manager actions are checked by the API role middleware.
11. **Earn the team badge.** Challenge progress counts completions from joined participants during the challenge period. When the goal is reached, each participant receives the configured badge and a private notification.

## Data flow

The SvelteKit client sends authenticated JSON requests to Express. JWT middleware identifies the account and role. Mongoose persists users, activities, activity events, challenges, memberships, and notifications in MongoDB. The event tracking path currently runs synchronously in the API process; EventBridge/Lambda are documented as cloud deployment extensions and are not active in this build.
