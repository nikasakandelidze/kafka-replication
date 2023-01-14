import { Body, Controller, Post } from '@nestjs/common';
import { OrderService } from 'src/provider/order.service';
import { OrderDto } from './dto/order.dto';

@Controller('api/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async addNewOrder(@Body() order: OrderDto) {
    return await this.orderService.addNewOrder(order);
  }
}
