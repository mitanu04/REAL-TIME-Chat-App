using System;
using System.Collections.Concurrent;
using System.Linq;
using API.Data;
using API.DTOs;
using API.Models;
using API.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;


namespace API.Hubs;

[Authorize]

public class ChatHub(UserManager<AppUser> userManager, AppDbContext dbContext) : Hub
{
    public static readonly ConcurrentDictionary<string, OnlineUserDto> onlineUsers = new();
    private string userId;



    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            throw new Exception("UserId is null in SignalR connection");
        }

        var currentUser = await userManager.FindByIdAsync(userId);
        var connectionId = Context.ConnectionId;

        if (onlineUsers.ContainsKey(userId))
        {
            onlineUsers[userId].ConnectionId = connectionId;
        }
        else
        {
            var use = new OnlineUserDto
            {
                Id = currentUser.Id, // 🔥 LIPSEA
                ConnectionId = connectionId,
                UserName = currentUser.UserName,
                ProfilePicture = currentUser.ProfileImage,
                FullName = currentUser.FullName,
                IsOnline = true
            };

            onlineUsers.TryAdd(userId, use);
        }

        await Clients.All.SendAsync("OnlineUsers", await GetAllUsers());

        await base.OnConnectedAsync();
    }

    public async Task LoadMessages(string receiverId, int pageNumber = 1)
    {
        int pageSize = 10;
        var username = Context.User!.Identity!.Name;
        var currentUser = await userManager.FindByNameAsync(username!);

        if (currentUser is null)
        {
            return;
        }

        List<MessageResponseDto> messages = await dbContext.Messages
        .Where(x => x.ReceiverId == currentUser!.Id && x.SenderId == receiverId
        || x.ReceiverId == receiverId && x.SenderId == currentUser!.Id)
        .OrderByDescending(x => x.CreatedDate)
        .Skip((pageNumber - 1) * pageSize)
        .Take(pageSize)
        .OrderBy(x => x.CreatedDate)
        .Select(x => new MessageResponseDto
        {
            Id = x.Id,
            Content = x.Content,
            CreatedDate = x.CreatedDate,
            IsRead = x.IsRead,
            ReceiverId = x.ReceiverId,
            SenderId = x.SenderId
        })
        .ToListAsync();

        foreach (var message in messages)
        {
            var msg = await dbContext.Messages.FirstOrDefaultAsync(x => x.Id == message.Id);

            if (msg != null && msg.ReceiverId == currentUser.Id)
            {
                msg.IsRead = true;
                await dbContext.SaveChangesAsync();
            }
        }
        await Clients.User(currentUser.Id)
        .SendAsync("ReceiveMessageList", messages);

    }

    public async Task SendMessage(MessageRequestDto message)
    {

        Console.WriteLine("🔥 SEND MESSAGE HIT");
        Console.WriteLine($"ReceiverId primit: {message.ReceiverId}");

        var senderUserName = Context.User!.Identity!.Name;

        var sender = await userManager.FindByNameAsync(senderUserName!);
        var recipient = await userManager.FindByIdAsync(message.ReceiverId);

        if (sender == null || recipient == null) return;

        var newMsg = new Message
        {
            SenderId = sender.Id,
            ReceiverId = recipient.Id,
            IsRead = false,
            CreatedDate = DateTime.UtcNow,
            Content = message.Content
        };

        dbContext.Messages.Add(newMsg);
        await dbContext.SaveChangesAsync();

        var response = new MessageResponseDto
        {
            Content = newMsg.Content,
            CreatedDate = newMsg.CreatedDate,
            IsRead = newMsg.IsRead,
            SenderId = newMsg.SenderId,
            ReceiverId = newMsg.ReceiverId
        };

        // 🔥 FOLOSIM ConnectionId din onlineUsers (NU Clients.User)

        var senderConnection = onlineUsers[sender.Id].ConnectionId;


        var recipientConnection = onlineUsers.ContainsKey(recipient.Id)
            ? onlineUsers[recipient.Id].ConnectionId
            : null;

        if (recipientConnection != null)
        {
            await Clients.Client(recipientConnection)
                .SendAsync("ReceiveMessage", response);
        }

        if (senderConnection != null)
        {
            await Clients.Client(senderConnection)
                .SendAsync("ReceiveMessage", response);
        }


    }


    public async Task NotifyTyping(string recipientUserName)


    {
        var senderUserName = Context.User!.Identity!.Name;

        if (senderUserName is null)
        {
            return;
        }

        var connectionId = onlineUsers.Values.FirstOrDefault(x => x.UserName == recipientUserName)?.ConnectionId;


        if (connectionId is not null)
        {
            await Clients.Client(connectionId).SendAsync("NotifyTypingToUser", senderUserName);
        }

    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        //var username = Context.User!.Identity!.Name;
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        onlineUsers.TryRemove(userId, out _);
        await Clients.All.SendAsync("OnlineUsers", await GetAllUsers());
    }

    private async Task<IEnumerable<OnlineUserDto>> GetAllUsers()
    {
        var currentUserId = Context.UserIdentifier;

        var onlineUsersSet = new HashSet<string>(onlineUsers.Keys);

        var users = await userManager.Users
            .Select(u => new OnlineUserDto
            {
                Id = u.Id, // 🔥 IMPORTANT
                UserName = u.UserName,
                FullName = u.FullName,
                ProfilePicture = u.ProfileImage,
                IsOnline = onlineUsersSet.Contains(u.Id), // 🔥 FIX
                UnreadCount = dbContext.Messages.Count(m =>
                    m.ReceiverId == currentUserId &&
                    m.SenderId == u.Id &&
                    !m.IsRead)
            })
            .OrderByDescending(u => u.IsOnline)
            .ToListAsync();

        return users;
    }

}
