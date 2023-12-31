import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Button,
  TextInput,
  Pressable,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";

const RedHeartIcon = () => {
  return <FontAwesome name="heart" size={35} color="red" />;
};

const GrayHeartIcon = () => {
  return <FontAwesome name="heart" size={24} color="gray" />;
};

export { RedHeartIcon, GrayHeartIcon };

function List({ navigation }) {
  const [foodData, setFoodData] = useState([]);
  const [filteredFoodData, setFilteredFoodData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedButton, setSelectedButton] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // Thêm trạng thái để lưu giá trị của thanh tìm kiếm
  const [favorites, setFavorites] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      const loadFavorites = async () => {
        try {
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser !== null) {
            setFavorites(JSON.parse(storedUser).favorite);
          }

        } catch (error) {
          console.error("Error loading favorites:", error);
        }
      };

      loadFavorites();
    }, [])
  );

  // Add a milk tea to favorites
  const addToFavorites = async (food) => {
    try {
      //const updatedFavorites = ;
      //etFavorites(updatedFavorites);

      // Save updated favorites to AsyncStorage
      //AsyncStorage.setItem("favorite", JSON.stringify(updatedFavorites));

      // Update favorites on the server
      const updateFavorite = async () => {
        try {
          const storedUser = await AsyncStorage.getItem('user');

          if (storedUser !== null) {
            const parsedUser = JSON.parse(storedUser);
            // Merge the new food id with the existing favorites
            if (!parsedUser.favorite.includes(food.id)) {
              const updatedFavorites = [...favorites, food.id];

              await axios.patch(`http://:3000/users/${parsedUser.id}`, {
                favorite: updatedFavorites
              });

              setFavorites(updatedFavorites);

              const response = await axios.get("http://:3000/users", {
                params: {
                  username: parsedUser.username,
                  password: parsedUser.password,
                },
              });

              const user = response.data[0];

              await AsyncStorage.setItem("user", JSON.stringify(user));
            }
          }
        } catch (error) {
          console.error('Error loading favorites:', error);
        }
      };

      updateFavorite();

      // Success message or further actions
      console.log("Successfully added to favorites");
    } catch (error) {
      console.error('Error while adding to favorites:', error);
      // Error handling
    }
  };

  // Remove a milk tea from favorites
  const removeFromFavorites = async (food) => {
    try {
      const storedUser = await AsyncStorage.getItem('user');

      if (storedUser !== null) {

        const parsedUser = JSON.parse(storedUser);

        if (parsedUser.favorite.includes(food.id)) {
          const updatedFavorites = parsedUser.favorite.filter(item => item !== food.id);

          await axios.patch(`http://:3000/users/${parsedUser.id}`, {
            favorite: updatedFavorites
          });

          setFavorites(updatedFavorites);

          const response = await axios.get("http://:3000/users", {
            params: {
              username: parsedUser.username,
              password: parsedUser.password,
            },
          });

          const user = response.data[0];

          await AsyncStorage.setItem("user", JSON.stringify(user));
        }
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  useEffect(() => {
    axios
      .get("http://:3000/foods")
      .then((response) => {
        const data = response.data;
        setFoodData(data);
        setFilteredFoodData(data);
        const uniqueCategories = [
          ...new Set(data.map((item) => item.category)),
        ];
        setCategories(uniqueCategories);
      })
      .catch((error) => {
        console.error("Lỗi khi lấy dữ liệu:", error);
      });
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const filteredData = foodData.filter(
        (item) => item.category === selectedCategory
      );
      setFilteredFoodData(filteredData);
    } else {
      setFilteredFoodData(foodData);
    }
  }, [selectedCategory, foodData]);

  useEffect(() => {
    // Thực hiện tìm kiếm dựa trên giá trị của thanh tìm kiếm
    const searchResult = foodData.filter((item) => {
      const foodNameMatch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const birdNameMatch = item.suitableFor.some((bird) =>
        bird.birdName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return foodNameMatch || birdNameMatch;
    });
    setFilteredFoodData(searchResult);
  }, [searchQuery, foodData]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate("FoodDetail", { food: item });
      }}
    >
      <View style={styles.foodItem}>
        <Image source={{ uri: item.image }} style={styles.foodImage} />
        <Text style={styles.foodName}>{item.name}</Text>
        <Pressable
          style={styles.favoriteContainer}
          onPress={() => {
            console.log(favorites);
            if (favorites.includes(item.id)) {
              removeFromFavorites(item);
            } else {
              addToFavorites(item);
            }
          }}>
          <View>
            {favorites.includes(item.id) ? (
              <RedHeartIcon />
            ) : (
              <GrayHeartIcon />
            )}
          </View>
        </Pressable>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm theo tên thức ăn hoặc tên loài chim"
        value={searchQuery}
        onChangeText={(text) => setSearchQuery(text)}
      />
      <View style={styles.filterContainer}>
        <Button
          title="Tất cả"
          onPress={() => {
            setSelectedCategory(null);
            setSelectedButton(null);
          }}
          color={selectedButton === null ? "blue" : "gray"}
        />
        {categories.map((category) => (
          <Button
            key={category}
            title={category}
            onPress={() => {
              setSelectedCategory(category);
              setSelectedButton(category);
            }}
            color={selectedButton === category ? "blue" : "gray"}
          />
        ))}
      </View>
      <FlatList
        style={styles.list}
        data={filteredFoodData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchInput: {
    marginTop: 60,
    padding: 10,
    borderColor: "gray",
    borderWidth: 1,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
  },
  foodItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  foodImage: {
    width: 150,
    height: 200,
    marginRight: 16,
  },
  foodName: {
    fontSize: 18,
  },
  favoriteContainer: {
    position: "absolute",
    top: 20,
    right: 20,
  },
});

export default List;
