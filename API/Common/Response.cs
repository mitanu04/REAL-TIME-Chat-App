using System;

namespace API.Common;

public class Response<T>
{
    public bool IsSuccess { get; }

    public T Data { get; }

    public string? Error { get; }

    public string? Message { get; set; }

    public Response(bool isSuccess, T data = default!, string? error = null, string? message = null)
    {
        IsSuccess = isSuccess;
        Data = data;
        Error = error;
        Message = message;
    }

    public static Response<T> Success(T data, string? message = null)
    {
        return new Response<T>(true, data, null, message);
    }

    public static Response<T> Failure(string error, string? message = null)
    {
        return new Response<T>(false, default!, error, message);
    }


    public static Response<T> SuccessMessage(string message)
    {
        return new Response<T>(true, default!, null, message);
    }


    public static Response<T> FailureMessage(string message)
    {
        return new Response<T>(false, default!, message, message);
    }


}
