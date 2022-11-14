![fakeflix](https://user-images.githubusercontent.com/47800618/201563513-c2c7a03a-7ee0-4fea-869c-76f83f2557ac.png)

![express_node](https://user-images.githubusercontent.com/47800618/201563527-2b3043d5-6390-43b5-bd4f-9af448df9394.png)

# IADT CC Y4 Advanced JS CA1

___

## Models & Endpoints:

<details>
<summary><b>Titles</b></summary>

GET

* /all
* /title/:type
* /type/:type
* /show/:show
* /id/:id

POST

* /create

PUT

* /update/:id

DELETE - /delete/:id
</details>

<details>
<summary><b>Users</b></summary>

POST

* /register
* /login

PUT

* /edit/:id?

DELETE

* /delete/:id?

GET

* /profile
* /manageProfiles
* /viewMyList
* /avatars

</details>

<details>
<summary><b>Avatars</b></summary>

GET

* /all

POST

* /

PUT

* /:id

DELETE

* /:id

</details>

## Features

- **Additional info API call from TVMaze**: Use the ?moreDetail=true query param on the show/:id endpoint to get more
  detail
  about the show.
- **Multi-tiered user authentication**:
    - User permissions object generated from maturity settings, subscription type, and user type.
    - Preliminary calls are made before each request with no filtering applied, filters are then validated against the
      response to let the user know why they can't access a specific resource.
    - User types are admin/user/child. Each user/child has an admin ID, tying them to an admin user. An admin can edit
      their sub-users (apart from changing key features like their admin ID or subscription type), and deleting
      themselves will cascade the delete to also remove their sub-users.
    - Only the above types have been faked, but another valid type __'database_admin'__ exists. This user is permitted
      to
      create, update, and delete Title listings.
- User favourites: Each user has a favourites list tied to object IDs. This list can be populated when viewing users
  using the ?populate=my_list query param on the /manageProfiles endpoint.
- User avatars: Similar to above, each user has an avatar ID tied to an avatar object. Use ?populate=avatars to populate
  with their real values when viewing users
- **Automated seeding**:
    - Mongoose schema converted to JSON schema using mongoose-schema-jsonschema. Fake data then generated using
      json-schema-faker.
    - Use npm run seed to generate 10 Avatars and 100 Users, with object references between the two, and references to
      real Title objects in each user's 'my_list'.
    - A subset of users will be admins. Between the admins and sub-users are real object references using the 'admin_id'
      field.
- A search key has been added to the database, enabling **fuzzy search** on the /title/:title and /show/:show endpoints.
  The
  latter also accepts IMDB IDs, which are validated.
- **Sort by, sort direction, and limit query params** may be applied to all Title endpoints excluding /id/:id.
- **Stripe integration** - When registering a new user, stripe customer and charge objects are generated, the correct
  fee is charged depending on the type of subscription the user has chosen, and stripe details are applied to the user
  object. The transaction is saved to my Stripe account, appearing on the dashboard.
- Avatar images hosted on S3 bucket.
  
  ![fakeflix1](https://user-images.githubusercontent.com/47800618/201789639-6cccead0-e5ed-40a8-8c9a-5cd4de6e8c1a.png)![fakeflix2](https://user-images.githubusercontent.com/47800618/201789650-08300fd7-09ab-448b-b366-b4aef37222e3.png)

