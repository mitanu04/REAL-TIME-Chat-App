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


    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        var recevierId = httpContext?.Request.Query["senderId"].ToString();
        var userName = Context.User!.Identity!.Name;
        var currentUser = await userManager.FindByNameAsync(userName);
        var connectionId = Context.ConnectionId;


        if (onlineUsers.ContainsKey(userName))
        {
            onlineUsers[userName].ConnectionId = connectionId;
        }
        else
        {
            var use = new OnlineUserDto
            {
                ConnectionId = connectionId,
                UserName = userName,
                ProfilePicture = currentUser.ProfileImage,
                FullName = currentUser.FullName,
            };

            onlineUsers.TryAdd(userName, use);

            await Clients.AllExcept(connectionId).SendAsync("Notify", currentUser);

        }

        if (!string.IsNullOrEmpty(recevierId))

            await LoadMessages(recevierId);

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
        var senderId = Context.User!.Identity.Name;
        var recipientId = message.ReceiverId;

        var newMsg = new Message
        {
            Sender = await userManager.FindByNameAsync(senderId!),
            Receiver = await userManager.FindByNameAsync(recipientId!),
            IsRead = false,
            CreatedDate = DateTime.UtcNow,
            Content = message.Content
        };

        dbContext.Messages.Add(newMsg);
        await dbContext.SaveChangesAsync();


        await Clients.User(recipientId).SendAsync("ReceiveMessage", newMsg);



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
        var username = Context.User!.Identity!.Name;
        onlineUsers.TryRemove(username, out _);
        await Clients.All.SendAsync("OnlineUsers", await GetAllUsers());
    }
    private async Task<IEnumerable<OnlineUserDto>> GetAllUsers()
    {
        var username = Context.User!.GetUserName();


        var onlineUsersET = new HashSet<String>(onlineUsers.Keys);

        var users = await userManager.Users.Select(u => new OnlineUserDto
        {
            UserName = u.UserName,
            FullName = u.FullName,
            ProfilePicture = u.ProfileImage,
            IsOnline = onlineUsersET.Contains(u.UserName!),
            UnreadCount = dbContext.Messages.Count(m => m.ReceiverId == username
            && m.SenderId == u.UserName && !m.IsRead)
        }).OrderByDescending(u => u.IsOnline)
        .ToListAsync();



        return users;

    }

}
