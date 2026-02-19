using System;
using API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using API.Common;
using API.Services;
using API.DTOs;
using API.Extensions;
using Microsoft.EntityFrameworkCore;



namespace API.Endpoints;

public static class AccountEndpoint
{
    public static RouteGroupBuilder MapAccountEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/account");

        group.MapPost("/register", async (
    UserManager<AppUser> userManager,
    HttpContext context,
    [FromForm] string fullName,
    [FromForm] string email,
    [FromForm] string password,
    [FromForm] string userName,
    [FromForm] IFormFile? profileImage
    ) =>
{
    // 1️⃣ user deja existent
    var userFromDb = await userManager.FindByEmailAsync(email);
    if (userFromDb is not null)
    {
        return Results.BadRequest(
            Response<object>.FailureMessage("An account with this email already exists.")
        );
    }

    if (profileImage is null)
    {
        return Results.BadRequest(
            Response<object>.FailureMessage("Profile image upload is required.")
        );
    }

    var picture = await FileUpload.Upload(profileImage);

    picture = $"{context.Request.Scheme}://{context.Request.Host}/uploads/{picture}";

    // 2️⃣ creare user
    var user = new AppUser
    {
        Email = email,
        FullName = fullName,
        UserName = userName,
        ProfileImage = picture
    };

    var result = await userManager.CreateAsync(user, password);

    // 3️⃣ erori Identity explicite
    if (!result.Succeeded)
    {
        var errors = result.Errors.Select(e => new
        {
            code = e.Code,
            description = e.Description
        });

        return Results.BadRequest(new
        {
            success = false,
            message = "User creation failed.",
            errors
        });
    }

    // 4️⃣ succes
    return Results.Ok(
        Response<string>.SuccessMessage("User created successfully.")
    );

}).DisableAntiforgery();



        group.MapPost("/login", async (
            UserManager<AppUser> userManager,
            TokenService tokenService, LoginDto dto) =>
        {
            if (dto is null)
            {
                return Results.BadRequest(
                    Response<string>.FailureMessage("Invalid login details.")
                );
            }
            var user = await userManager.FindByEmailAsync(dto.Email);

            if (user is null)
            {
                return Results.BadRequest(
                    Response<string>.FailureMessage("User was not found.")
                );
            }

            var result = await userManager.CheckPasswordAsync(user!, dto.Password);
            if (!result)
            {
                return Results.BadRequest(
                    Response<string>.FailureMessage("Invalid password.")
                );
            }

            var token = tokenService.GenerateToken(user.Id, user.UserName!);

            return Results.Ok(
                Response<string>.Success(token, "Login successful.")
            );
        });


        group.MapGet("/me", async (HttpContext context, UserManager<AppUser> userManager) =>
        {
            var currentUserId = context.User.GetUserId()!;

            var currentLoggedINUser = await userManager.Users.SingleOrDefaultAsync(x => x.Id == currentUserId.ToString());

            return Results.Ok(
                Response<AppUser>.Success(currentLoggedINUser!, "Current user retrieved successfully.")
            );
        }).RequireAuthorization();

        return group;

    }

}
