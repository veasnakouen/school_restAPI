using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Entities;

namespace SchoolAPI.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IApplicationDbContext _context;

    public ChatHub(IApplicationDbContext context)
    {
        _context = context;
    }

    // Maps ConnectionId to UserName to easily track who is currently online
    private static readonly ConcurrentDictionary<string, string> OnlineUsers = new();

    public override async Task OnConnectedAsync()
    {
        // Look through common JWT claim types to accurately find the user's name
        var userName = Context.User?.Identity?.Name 
            ?? Context.User?.FindFirst(ClaimTypes.Name)?.Value 
            ?? Context.User?.FindFirst("fullName")?.Value
            ?? Context.User?.FindFirst("email")?.Value
            ?? "Anonymous";
            
        OnlineUsers.TryAdd(Context.ConnectionId, userName);
        
        // Notify everyone that someone joined
        await Clients.All.SendAsync("UserConnected", userName);
        // Send the current list of online users to the person who just joined
        await Clients.Caller.SendAsync("UpdateOnlineUsers", OnlineUsers.Values.Distinct());
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (OnlineUsers.TryRemove(Context.ConnectionId, out var userName))
        {
            // Only notify that the user disconnected if they have no other active tabs/connections open!
            if (!OnlineUsers.Values.Contains(userName))
            {
                await Clients.All.SendAsync("UserDisconnected", userName);
                // Also broadcast the new list of online users to everyone
                await Clients.All.SendAsync("UpdateOnlineUsers", OnlineUsers.Values.Distinct(), Context.ConnectionAborted);
            }
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendPrivateMessage(string targetUserName, string message, string? attachmentUrl = null, string? attachmentName = null)
    {
        var userName = OnlineUsers.GetValueOrDefault(Context.ConnectionId, "Anonymous");
        var targetConnections = OnlineUsers.Where(kvp => kvp.Value == targetUserName).Select(kvp => kvp.Key).ToList();
        var senderConnections = OnlineUsers.Where(kvp => kvp.Value == userName).Select(kvp => kvp.Key).ToList();
        
        var timestamp = DateTime.UtcNow;
        var allConnectionsToNotify = targetConnections.Concat(senderConnections).Distinct().ToList();

        // 1. Save to Database
        var chatMessage = new ChatMessage
        {
            Id = Guid.NewGuid().ToString(),
            Sender = userName,
            Receiver = targetUserName,
            Message = message,
            Timestamp = timestamp,
            AttachmentUrl = attachmentUrl,
            AttachmentName = attachmentName
        };
        
        _context.ChatMessages.Add(chatMessage);
        await _context.SaveChangesAsync(Context.ConnectionAborted);

        // 2. Broadcast to connected clients
        foreach (var connectionId in allConnectionsToNotify)
        {
            await Clients.Client(connectionId).SendAsync("ReceivePrivateMessage", userName, targetUserName, message, timestamp, attachmentUrl, attachmentName);
        }
    }

    public async Task SendTypingIndicator(string targetUserName)
    {
        var userName = OnlineUsers.GetValueOrDefault(Context.ConnectionId, "Anonymous");
        var targetConnections = OnlineUsers.Where(kvp => kvp.Value == targetUserName).Select(kvp => kvp.Key).ToList();
        
        foreach (var connectionId in targetConnections)
        {
            await Clients.Client(connectionId).SendAsync("UserTyping", userName);
        }
    }

    // Load message history for a specific conversation
    public async Task LoadHistory(string targetUserName)
    {
        var currentUserName = OnlineUsers.GetValueOrDefault(Context.ConnectionId, "Anonymous");
        
        var history = await _context.ChatMessages
            .Where(m => (m.Sender == currentUserName && m.Receiver == targetUserName) || 
                        (m.Sender == targetUserName && m.Receiver == currentUserName))
            .OrderBy(m => m.Timestamp)
            .ToListAsync(Context.ConnectionAborted);

        await Clients.Caller.SendAsync("ReceiveHistory", history);
    }

    public async Task MarkAsRead(string senderUserName)
    {
        var currentUserName = OnlineUsers.GetValueOrDefault(Context.ConnectionId, "Anonymous");
        var senderConnections = OnlineUsers.Where(kvp => kvp.Value == senderUserName).Select(kvp => kvp.Key).ToList();
        
        foreach (var connectionId in senderConnections)
        {
            await Clients.Client(connectionId).SendAsync("MessagesSeen", currentUserName);
        }
    }
}