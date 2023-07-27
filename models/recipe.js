"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Recipe {
  /** Create a recipe (from data), update db, return new recipe data.
   *
   * data should be { aisle, image, name, amount, unit, original }
   *
   * Returns { id, aisle, image, name, amount, unit, details }
   **/

  static async create(data) {
    const result = await db.query(
      `INSERT INTO recipes ( vegetarian,
        vegan,
        dairyfree,
        weightwatchersmartpoints,
        creditstext,
        title,
        readyinminutes,
        servings,
        sourceurl,
        image,
        imagetype,
        dishtype,
        diets,
        summary)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id,  
           vegetarian,
           vegan,
           dairyfree,
           weightwatchersmartpoints,
           creditstext,
           title,
           readyinminutes,
           servings,
           sourceurl,
           image,
           imagetype as "imageType",
           dishtype as "dishTypes",
           diets,
           summary`,
      [data.aisle, data.image, data.name, data.amount, data.unit, data.original]
    );
    let recipe = result.rows[0];

    return recipe;
  }

  /** Find all recipes
   *
   * Returns [{ id, aisle, image, name, amount, unit, details }, ...]
   * */

  static async findAll() {
    let query = `SELECT r.id,
                        r.vegetarian,
                        r.vegan,
                        r.dairyfree,
                        r.weightwatchersmartpoints,
                        r.creditstext,
                        r.title,
                        r.readyinminutes,
                        r.servings,
                        r.sourceurl,
                        r.image,
                        r.imagetype,
                        r.dishtype,
                        r.diets,
                        r.summary.
                 FROM recipes r`;
    let whereExpressions = [];
    let queryValues = [];

    // TODO: Search Filters - to be implemented
    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    // Finalize query and return results

    query += " ORDER BY title";
    const recipesRes = await db.query(query, queryValues);
    return recipesRes.rows;
  }

  /** Given a recipe id, return data about recipe.
   *
   * Returns { id, aisle, image, name, amount, unit, details }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const recipeRes = await db.query(
      `SELECT id,
                vegetarian,
                vegan,
                dairyfree,
                weightwatchersmartpoints,
                creditstext,
                title,
                readyinminutes,
                servings,
                sourceurl,
                image,
                imagetype as "imageType",
                dishtype as "dishTypes",
                diets,
                summary
           FROM recipes
           WHERE id = $1`,
      [id]
    );

    const recipe = recipeRes.rows[0];

    if (!recipe) throw new NotFoundError(`No recipe: ${id}`);

    return recipe;
  }

  /** Update recipe data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include: { aisle, image, name, amount, unit, original }
   *
   * Returns { id, aisle, image, name, amount, unit, details }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE recipes 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING { id, 
                        vegetarian,
                        vegan,
                        dairyfree,
                        weightwatchersmartpoints,
                        creditstext,
                        title,
                        readyinminutes,
                        servings,
                        sourceurl,
                        image,
                        imagetype as "imageType",
                        dishtype as "dishTypes",
                        diets,
                        summary }`;
    const result = await db.query(querySql, [...values, id]);
    const recipe = result.rows[0];

    if (!recipe) throw new NotFoundError(`No recipe: ${id}`);

    return recipe;
  }

  /** Delete given recipe from database; returns undefined.
   *
   * Throws NotFoundError if recipe not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM recipes
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const recipe = result.rows[0];

    if (!recipe) throw new NotFoundError(`No recipe: ${id}`);
  }
}

module.exports = Recipe;
