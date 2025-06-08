import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm'
import { Town } from './town';
import { Food } from './food';

@Entity()
export class Person {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Town, town => town.people)
  livesInTown: Town;

  @JoinTable()
  @ManyToMany(() => Food, food => food.people)
  favoriteFood: Food[];

}
