import { DataSource, DeepPartial } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Person, Town, Country, Food } from './entities';

export function getDataSourcePostgres() {
  return new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT),
    username: process.env.POSTGRES_USERNAME,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    dropSchema: true,
    synchronize: true,
    entities: [Person, Town, Country, Food],
    namingStrategy: new SnakeNamingStrategy(),
  });
}

export function getDataSourceSqlite() {
  return new DataSource({
    type: 'sqlite',
    database: ':memory:',
    dropSchema: true,
    synchronize: true,
    entities: [Person, Town, Country, Food],
    namingStrategy: new SnakeNamingStrategy(),
  });
}

export async function createSampleData(dataSource: DataSource) {
  const mgr = dataSource.manager;
  const createEntities = async <T>(type: { new(): T }, items: DeepPartial<T>[]) => {
    const entities = items.map(item => mgr.create(type, item));
    return mgr.save(entities);
  };
  const [germany, uk, usa, japan] = await createEntities(Country, [
    { name: "Germany" },
    { name: "UK" },
    { name: "USA" },
    { name: "Japan" },
  ]);
  const [sushi, pizza, hotdog, curry, steak, ramen, salad, tuna, pasta] = await createEntities(Food, [
    { name: "sushi" },
    { name: "pizza" },
    { name: "hot-dog" },
    { name: "curry" },
    { name: "steak" },
    { name: "ramen" },
    { name: "salad" },
    { name: "tuna" },
    { name: "pasta" },
  ]);
  const [berlin, london, newYork, tokyo] = await createEntities(Town, [
    { name: "Berlin", country: germany, population: 3 },
    { name: "London", country: uk, population: 8 },
    { name: "New York", country: usa, population: 8 },
    { name: "Tokyo", country: japan, population: 14 },
  ]);
  await createEntities(Person, [
    { name: "Eva", livesInTown: berlin, favoriteFood: [sushi, pasta, pizza, salad] },
    { name: "Peter", livesInTown: berlin, favoriteFood: [steak, tuna, hotdog] },
    { name: "John", livesInTown: london, favoriteFood: [pasta, pizza, salad, ramen] },
    { name: "Kristin", livesInTown: london, favoriteFood: [ramen, sushi, tuna] },
    { name: "Diego", livesInTown: london, favoriteFood: [steak, pizza, hotdog, curry] },
    { name: "Sergej", livesInTown: newYork, favoriteFood: [pizza, tuna, curry] },
    { name: "Clara", livesInTown: tokyo, favoriteFood: [curry, ramen, steak, sushi, pizza] },
  ]);
}
