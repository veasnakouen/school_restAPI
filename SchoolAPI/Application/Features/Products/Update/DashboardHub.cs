using Microsoft.AspNetCore.SignalR;

namespace SchoolAPI.Hubs;

public class DashboardHub : Hub
{
    // This is a generic hub for broadcasting real-time dashboard updates.
    // Connected React/Angular clients will listen to events sent from the backend command handlers.
}