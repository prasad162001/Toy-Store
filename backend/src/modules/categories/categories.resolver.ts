import { Resolver, Query, Args } from '@nestjs/graphql';
import { CategoriesService } from './categories.service';
import { CategoryType } from '../products/dto/products.dto';

@Resolver(() => CategoryType)
export class CategoriesResolver {
  constructor(private categoriesService: CategoriesService) {}

  @Query(() => [CategoryType])
  async categories(): Promise<CategoryType[]> {
    return this.categoriesService.getCategories();
  }

  @Query(() => CategoryType, { nullable: true })
  async category(@Args('slug') slug: string): Promise<CategoryType | null> {
    return this.categoriesService.getCategoryBySlug(slug);
  }
}
