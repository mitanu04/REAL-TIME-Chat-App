using System;


namespace API.Models;

public class Message
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? SenderId { get; set; }
    public string? ReceiverId { get; set; }
    public DateTime CreatedDate { get; set; }
    public bool IsRead { get; set; }

    public AppUser? Sender { get; set; }
    public AppUser? Receiver { get; set; }
}
