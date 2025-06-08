import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm'
import { Person } from './person';

@Entity()
export class Food {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToMany(() => Person, person => person.favoriteFood)
  people: Person[];

}
