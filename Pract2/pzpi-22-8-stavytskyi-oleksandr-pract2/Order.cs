using System;

public enum OrderStatus
{
    New,
    Processing,
    Completed,
    Canceled
}

public class Order
{
    private const decimal ShippingCost = 5.99m;
    public decimal Amount { get; set; }
    public OrderStatus Status { get; set; }
    
    private readonly PaymentService _paymentService;

    public Order()
    {
        _paymentService = new PaymentService();
    }

    public bool ProcessPayment()
    {
        if (Amount > 0)
        {
            return _paymentService.ProcessPayment(this);
        }
        return false;
    }

    public decimal CalculateTotal()
    {
        return Amount + ShippingCost;
    }
}

public class PaymentService
{
    public bool ProcessPayment(Order order)
    {
        if (order.Amount > 0)
        {
            Console.WriteLine($"Payment of {order.Amount:C} processed.");
            return true;
        }
        return false;
    }
}

public class OrderManager
{
    public void UpdateOrderStatus(Order order, OrderStatus newStatus)
    {
        order.Status = newStatus;
        Console.WriteLine($"Order status updated to {order.Status}");
    }

    public void DisplayOrderDetails(Order order)
    {
        Console.WriteLine($"Order Status: {order.Status}");
        Console.WriteLine($"Order Total: {order.CalculateTotal():C}");
    }
}

public class OrderService
{
    public void ProcessOrder(Order order)
    {
        switch (order.Status)
        {
            case OrderStatus.New:
            case OrderStatus.Processing:
            case OrderStatus.Completed:
            case OrderStatus.Canceled:
                Console.WriteLine($"Order is {order.Status.ToString().ToLower()}...");
                break;
            default:
                Console.WriteLine("Invalid order status.");
                break;
        }
    }
}

public class Program
{
    public static void Main(string[] args)
    {
        Order order = new Order { Amount = 100.00m, Status = OrderStatus.New };

        OrderManager orderManager = new OrderManager();
        orderManager.DisplayOrderDetails(order);

        if (order.ProcessPayment())
        {
            orderManager.UpdateOrderStatus(order, OrderStatus.Processing);
        }

        orderManager.DisplayOrderDetails(order);

        OrderService orderService = new OrderService();
        orderService.ProcessOrder(order);
    }
}
