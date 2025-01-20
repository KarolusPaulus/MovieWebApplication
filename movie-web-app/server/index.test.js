
import { initializeTestDb, insertTestUser, getToken, insertTestReview } from './helpers/test.js';
import { expect } from "chai";

const base_url = "http://localhost:3001";

// Before running the tests, we need to initialize the test database
before(async() => {
    await initializeTestDb()
})

//Tests for UserRouter

describe('POST register', () => {
    const email = 'register@foo.com';
    const password = 'register123';

    it('should register with valid email and password', async () => {
        const response = await fetch(base_url + '/user/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 'email': email, 'password': password })
        });
        const data = await response.json();
        expect(response.status).to.equal(201, data.error);
        expect(data).to.be.an('object');
        expect(data).to.include.all.keys('user_id', 'email');
    });

    })

    describe('DELETE /user/delete', () => {
        const email = 'removableuser@foo.com';
        const password = 'password123';
        let token;
    
        before(async () => {
            // Insert the test user into the DB
            await insertTestUser(email, password);
            await new Promise(resolve => setTimeout(resolve, 200)); // Optional delay for data commit
    
            // Login to get the token
            const response = await fetch(base_url + '/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 'email': email, 'password': password })
            });
    
            const data = await response.json();
            expect(response.status).to.equal(200, data.error);
            expect(data).to.be.an('object');
            expect(data).to.include.all.keys('user_id', 'email', 'token'); // Expect user_id, email, and token
    
            // Store the token for subsequent requests
            token = data.token;
        });
    
        it('should return 401 Unauthorized if no token is provided', async () => {
            const response = await fetch(base_url + '/user/delete', {
                method: 'DELETE',
    
            });
    
            const data = await response.json();
            expect(response.status).to.equal(401);
            expect(data.message).to.equal('Authorization required');
        });
    
        it('should return 403 Unauthorized if an invalid token is provided', async () => {
            const response = await fetch(base_url + '/user/delete', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer invalidtoken`
                }
            });
    
            const data = await response.json();
            expect(response.status).to.equal(403);
            expect(data.message).to.equal('Invalid credentials');
        });

        it('should delete the user account successfully', async () => {
            // Delete user using the token
            const response = await fetch(base_url + '/user/delete', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            const data = await response.json();
            expect(response.status).to.equal(200);
            expect(data.message).to.equal('User deleted successfully');
        });
    
        
    });

describe('POST login', () => {
    const email = 'login@foo.com'
    const password = 'login123'

 before(async () => {
        await insertTestUser(email, password); // Wait for the user to be inserted to the DB
        await new Promise(resolve => setTimeout(resolve, 200)); // Optional delay for data commit
    });

    it ('should login with valid credentials', async () => {
        const response = await fetch(base_url + '/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({'email':email, 'password':password})
        })

        const data = await response.json()
        expect(response.status).to.equal(200, data.error)
        expect(data).to.be.an('object')
        expect(data).to.include.all.keys('user_id','email','token') // Expect user_id, email, and token
    })
})

describe('POST /user/logout', () => {
    const email = 'logout@foo.com'
    const password = 'logout123'
    let token;

    before(async () => {
        await insertTestUser(email, password); // Wait for the user to be inserted to the DB
        await new Promise(resolve => setTimeout(resolve, 200)); // Optional delay for data commit

        // Login test user 
        const response = await fetch(base_url + '/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 'email': email, 'password': password })
        });

        const data = await response.json();
        expect(response.status).to.equal(200, data.error);
        expect(data).to.be.an('object');
        expect(data).to.include.all.keys('user_id', 'email', 'token'); // Expect user_id, email, and token

        // Store the token for subsequent requests
        token = data.token;

    });

    it ('should logout the user successfully', async () => {

        // Logout the user
        const response = await fetch(base_url + '/user/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        expect(response.status).to.equal(200, data.error);
        expect(data).to.be.an('object');
        expect(data.message).to.equal('User successfully logged out');
    });

    it('should prevent access to protected routes after logout', async () => {
        // Attempt to delete user after logging out
        const response = await fetch(base_url + '/user/delete', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        expect(response.status).to.equal(403);
        const data = await response.json();
        expect(data.message).to.equal('Token has been invalidated. Please login again.');
    });

})


//Tests for Groups

describe('POST /groups/create', () => {
    const owner_id = '1' // Needs to be a real user_id from Users, 1 because there will always be a user with id 1
    const name = 'Sample Group'
    const description = 'A sample group for testing'

    it('should return an error if required fields are missing', async () => { 
        const response = await fetch(base_url + '/groups/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // Missing owner_id and name
                description
            })
        })

        const data = await response.json()
        expect(response.status).to.equal(400)
        expect(data).to.be.an('object')
        expect(data).to.have.property('error')
    })


    it('should register a new group with valid data', async () => {
        const response = await fetch(base_url + '/groups/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                owner_id,
                name,
                description
            })
        })

       const data = await response.json()
                expect(response.status).to.equal(200, data.error)
                expect(data).to.be.an('object')
                expect(data).to.include.all.keys('group_id', 'owner_id', 'name', 'description') // Expect all keys
    })
    

    it('should return an error if the group name already exists', async () => {

        before(async () => {
            await new Promise(resolve => setTimeout(resolve, 200)); // Delay for data commit
        });

        const response = await fetch(base_url + '/groups/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                owner_id,
                name,
                description
            })
        })

        const data = await response.json()
        expect(response.status).to.equal(400)
        expect(data).to.be.an('object')
        expect(data).to.have.property('error')
    })

})

// Delete Group Tests
describe('DELETE /groups/delete/:groupId', () => {
    const ownerEmail = 'owner@foo.com';
    const ownerPassword = 'password123';
    let ownerToken;
    let ownerUserId;
    let ownerGroupId;
  
    before(async () => {
      // Insert owner user into the database
      await insertTestUser(ownerEmail, ownerPassword);
      await new Promise(resolve => setTimeout(resolve, 200)); // Optional delay for data commit
  
      // Log in user to get token and user ID
      const ownerLoginResponse = await fetch(`${base_url}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: ownerEmail,
          password: ownerPassword,
        }),
      });
      const ownerLoginData = await ownerLoginResponse.json();
      expect(ownerLoginResponse.status).to.equal(200, ownerLoginData.error);
      ownerToken = ownerLoginData.token;
      ownerUserId = ownerLoginData.user_id;

  
      // Insert a new group for the owner
      const createGroupResponse = await fetch(`${base_url}/groups/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner_id: ownerUserId,
          name: 'Removable Group',
          description: 'A group that can be removed',
        }),
      });
      const groupData = await createGroupResponse.json();
      expect(createGroupResponse.status).to.equal(200, groupData.error);
      ownerGroupId = groupData.group_id;
    });
  
    it('should not allow deletion with an invalid token', async () => {
      const response = await fetch(`${base_url}/groups/delete/${ownerGroupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer invalid_token',
        },
      });
  
      const data = await response.json();
      expect(response.status).to.equal(403);
      expect(data).to.be.an('object');
      expect(data.message).to.equal('Invalid credentials');
    });
  
    it('should allow owner to delete the group', async () => {
      const response = await fetch(`${base_url}/groups/delete/${ownerGroupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
        },
      });
  
      const data = await response.json();
      expect(response.status).to.equal(200);
      expect(data).to.be.an('object');
      expect(data.message).to.equal('Group deleted successfully.');
    });
  });

// Group Members Tests

// Add Group Member

describe('POST /groupMembers/add', () => {
    const groupMemberEmail = 'groupmember@foo.com'
    const groupMemberPassword = 'password123'
    let groupMemberUserId;
    let memberToken;
    const groupId = 1; // Join previously created test group

    before(async () => {
        await insertTestUser(groupMemberEmail, groupMemberPassword)
        await new Promise(resolve => setTimeout(resolve, 200))
    

   // Log the user in to get the user_id
   const memberLoginResponse = await fetch(`${base_url}/user/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: groupMemberEmail,
      password: groupMemberPassword,
    }),
  });
  const memberLoginData = await memberLoginResponse.json();
  expect(memberLoginResponse.status).to.equal(200, memberLoginData.error);
  memberToken = memberLoginData.token;
  groupMemberUserId = memberLoginData.user_id;
  console.log('Member user_id:', groupMemberUserId);
    
    })

    it('should allow the user to request to join a group', async () => {
        // User requests to join the group
        const response = await fetch(`${base_url}/groupMembers/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${memberToken}`
            },
            body: JSON.stringify({
                user_id: groupMemberUserId,
                group_id: groupId,
                role: 'member',
                status: 'pending'
            }),
        });

        const data = await response.json();
        expect(response.status).to.equal(200);
        expect(data).to.be.an('object');
        expect(data).to.include.all.keys('user_id', 'group_id', 'role', 'status');
        expect(data.user_id).to.equal(groupMemberUserId);
        expect(data.group_id).to.equal(groupId);
        expect(data.role).to.equal('member')
        expect(data.status).to.equal('pending')
    })

    it('should return an error if the user is already a member', async () => {
        const response = await fetch(`${base_url}/groupMembers/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${memberToken}`
            },
            body: JSON.stringify({
                user_id: groupMemberUserId,
                group_id: groupId,
                role: 'member',
                status: 'pending'
            }),
        })

        const data = await response.json()
        expect(response.status).to.equal(400)
        expect(data).to.be.an('object')
        expect(data.error).to.equal('User is already a member or request is pending.')
    })
});

// Review router test
describe('GET /reviews/:movieId', () => {
    let userId
    const reviewerEmail = 'reviewer@example.com'
    const reviewerPassword = 'password123'
    const testMovieId = '533535'

    before(async () => {
        // Insert a test user into the database and get the user ID
        const testUser = await insertTestUser(reviewerEmail, reviewerPassword)
        userId = testUser.user_id
        // Insert a test review for the given movie and user into the database
        await insertTestReview(testMovieId, userId, 'Great movie!', 5)
    })

    it('should return reviews for a valid movie ID', async () => {
        // Make a GET request to retrieve reviews for the test movie ID
        const response = await fetch(`${base_url}/reviews/${testMovieId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        expect(response.status).to.equal(200)

        const responseBody = await response.json()
        const { reviews } = responseBody

        expect(reviews).to.be.an('array')
        expect(reviews.length).to.be.greaterThan(0)
        expect(reviews[0]).to.have.all.keys('id', 'author', 'content', 'rating', 'createdAt')
        expect(reviews[0].author).to.equal(reviewerEmail)
        expect(reviews[0].content).to.equal('Great movie!')
        expect(reviews[0].rating).to.equal(5)
        expect(reviews[0].createdAt).to.be.a('string')
    })

    it('should return an empty array for a movie with no reviews', async () => {
        
        const nonExistentMovieId = '1234567'
        // Make a GET request to retrieve reviews for a movie that doesn't exist
        const response = await fetch(`${base_url}/reviews/${nonExistentMovieId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        expect(response.status).to.equal(200)

        const responseBody = await response.json()
        const { reviews } = responseBody

        expect(reviews).to.be.an('array')
        expect(reviews.length).to.equal(0)
    })

    it('should return 400 for invalid movie ID format', async () => {
        const invalidMovieId = 'abcd' // Invalid movie ID format
    
        // Make a GET request to retrieve reviews for an invalid movie ID
        const response = await fetch(`${base_url}/reviews/${invalidMovieId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
    
        expect(response.status).to.equal(400) // Expect a 400 Not Found response for invalid format
    })
    })

// Remove Group Member

describe('DELETE /groupMembers/remove', () => {
    const groupMemberEmail = 'removablegroupmember@foo.com'
    const groupMemberPassword = 'password123'
    let groupMemberUserId;
    let memberToken;
    const groupId = 1; // Join previously created test group
    const ownerId= 1; // Owner of the group 1

    before(async () => {
        await insertTestUser(groupMemberEmail, groupMemberPassword)
        await new Promise(resolve => setTimeout(resolve, 200))
    

   // Log the user in to get the user_id
   const memberLoginResponse = await fetch(`${base_url}/user/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: groupMemberEmail,
      password: groupMemberPassword,
    }),
  });
  const memberLoginData = await memberLoginResponse.json();
  expect(memberLoginResponse.status).to.equal(200, memberLoginData.error);
  memberToken = memberLoginData.token;
  groupMemberUserId = memberLoginData.user_id;
  console.log('Member user_id:', groupMemberUserId);

  // Add the user to the group

    const addMemberResponse = await fetch(`${base_url}/groupMembers/add`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        user_id: groupMemberUserId,
        group_id: groupId,
        }),
    });

    // Check that member was added successfully

    const addMemberData = await addMemberResponse.json();
    expect(addMemberResponse.status).to.equal(200, addMemberData.error);
    expect(addMemberData).to.be.an('object');
    expect(addMemberData).to.include.all.keys('user_id', 'group_id');
    expect(addMemberData.user_id).to.equal(groupMemberUserId);
    expect(addMemberData.group_id).to.equal(groupId);

    
    });

    it ('should allow the user to remove themselves from the group', async () => {
        const removeMemberResponse = await fetch(`${base_url}/groupMembers/remove`, {
            method: 'DELETE',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${memberToken}`,
             },
            body: JSON.stringify({
            user_id: groupMemberUserId,
            group_id: groupId,
            }),
        });

        const removeMemberData = await removeMemberResponse.json();
        expect(removeMemberResponse.status).to.equal(200, removeMemberData.error);
        expect(removeMemberData).to.be.an('object');
        expect(removeMemberData).to.include.all.keys('message', 'removedMember');
        expect(removeMemberData.message).to.equal('User removed from the group.');
        expect(removeMemberData.removedMember).to.be.an('object');
        expect(removeMemberData.removedMember.user_id).to.equal(groupMemberUserId);
        expect(removeMemberData.removedMember.group_id).to.equal(groupId);

    })  

    it ('should not allow a user to remove another user from the group', async () => {
        const removeMemberResponse = await fetch(`${base_url}/groupMembers/remove`, {
            method: 'DELETE',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${memberToken}`,
             },
            body: JSON.stringify({
            user_id: ownerId,
            group_id: groupId,
            }),
        });

        const removeMemberData = await removeMemberResponse.json();
        expect(removeMemberResponse.status).to.equal(403, removeMemberData.error);
        expect(removeMemberData).to.be.an('object');
        expect(removeMemberData).to.have.property('error', 'You are not authorized to remove this user.');
    })
})